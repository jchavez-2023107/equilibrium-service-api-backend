import Appointment from "./citas.model.js";
import User from "../User/user.model.js";
import { Types } from "mongoose";
import { createAppointmentNotification } from "../Notification/notification.controller.js";

// SOCKET helper
function getIO(req) {
  return req.app && req.app.locals && req.app.locals.io;
}

// Helper para verificar si fecha está dentro del horario disponible del voluntario
const isWithinSchedule = (scheduledAt, schedules) => {
  if (!schedules || schedules.length === 0) return true;
  const date = new Date(scheduledAt);
  const day = date.toLocaleDateString("en-US", { weekday: "long" });
  for (const sched of schedules) {
    if (sched.day.toLowerCase() === day.toLowerCase()) {
      const [fromHour, fromMin] = sched.from.split(":").map(Number);
      const [toHour, toMin] = sched.to.split(":").map(Number);
      const from = new Date(date);
      from.setHours(fromHour, fromMin, 0, 0);
      const to = new Date(date);
      to.setHours(toHour, toMin, 0, 0);
      if (date >= from && date <= to) return true;
    }
  }
  return false;
};

export const createAppointment = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    const {
      volunteerId,
      scheduledAt,
      reason,
      notes,
      userId: bodyUserId, // ← puede venir del voluntario
    } = req.body;

    // Determinar userId: si es USER usa su propio ID, si es VOLUNTEER o ADMIN toma del body
    const userId = requesterRole === "USER" ? requesterId : bodyUserId;

    // Validar existencia de usuario
    const targetUser = await User.findById(userId);
    if (!targetUser || targetUser.role !== "USER") {
      return res.status(400).json({ message: "Usuario asignado no válido." });
    }

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== "VOLUNTEER") {
      return res.status(404).json({ message: "Voluntario no válido o no encontrado." });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return res.status(400).json({ message: "La fecha programada debe ser una fecha futura válida." });
    }

    if (!isWithinSchedule(scheduledAt, volunteer.volunteerData.schedules)) {
      return res.status(400).json({ message: "El voluntario no está disponible en ese horario." });
    }

    // Verificar duplicados exactos
    const existing = await Appointment.findOne({
      userId,
      volunteerId,
      scheduledAt: scheduledDate
    });
    if (existing) {
      return res.status(409).json({ message: "Ya tienes una cita agendada con este voluntario en esa fecha y hora." });
    }

    // Crear la cita
    const appointment = new Appointment({
      userId,
      volunteerId,
      scheduledAt: scheduledDate,
      reason,
      notes,
    });

    // --- AQUI VA LO DE LA MODIFICACIÓN, NO LO CAMBIES ---
    await appointment.save();
    await appointment.populate([
      { path: "userId", select: "username profile.displayName" },
      { path: "volunteerId", select: "username profile.displayName" }
    ]);

    await createAppointmentNotification(appointment, "CREATED");

    // -------- SOCKET.IO: Notificar a usuario y voluntario --------
    const io = getIO(req);
    if (io) {
      io.to(userId.toString()).emit("appointment:new", appointment);
      io.to(volunteerId.toString()).emit("appointment:new", appointment);
    }

    return res.status(201).json({ message: "Cita creada exitosamente", appointment });

  } catch (error) {
    return res.status(500).json({ message: "Error al crear la cita", error: error.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const { role, id } = req.user;
    const {
      userId: queryUserId,
      userName,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};

    if (role === "ADMIN") {
      if (queryUserId) {
        if (!Types.ObjectId.isValid(queryUserId)) {
          return res.status(400).json({ message: "ID de usuario inválido en filtro" });
        }
        filter.userId = queryUserId;
      }
    } else if (role === "VOLUNTEER") {
      filter.volunteerId = id;
    } else if (role === "USER") {
      filter.userId = id;
    } else {
      return res.status(403).json({ message: "Rol no autorizado para esta acción" });
    }

    if (status) {
      const statuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
      if (!statuses.includes(status.toUpperCase())) {
        return res.status(400).json({ message: "Estado inválido en filtro" });
      }
      filter.status = status.toUpperCase();
    }

    if (fromDate || toDate) {
      filter.scheduledAt = {};
      if (fromDate) {
        const from = new Date(fromDate);
        if (isNaN(from.getTime())) {
          return res.status(400).json({ message: "Fecha desde inválida" });
        }
        filter.scheduledAt.$gte = from;
      }
      if (toDate) {
        const to = new Date(toDate);
        if (isNaN(to.getTime())) {
          return res.status(400).json({ message: "Fecha hasta inválida" });
        }
        filter.scheduledAt.$lte = to;
      }
    }

    if (userName && (role === "ADMIN" || role === "VOLUNTEER")) {
      const usersFound = await User.find({
        "profile.displayName": { $regex: userName, $options: "i" },
      }).select("_id");

      const userIdsFilter = usersFound.map(u => u._id);
      if (userIdsFilter.length === 0) {
        return res.json({ page: 1, limit: parseInt(limit), total: 0, appointments: [] });
      }
      filter.userId = { $in: userIdsFilter };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const appointments = await Appointment.find(filter)
      .populate("userId", "username profile.displayName")
      .populate("volunteerId", "username profile.displayName")
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const total = await Appointment.countDocuments(filter);

    return res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      appointments,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener las citas", error: error.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const appointment = await Appointment.findById(id)
      .populate("userId", "username profile.displayName")
      .populate("volunteerId", "username profile.displayName");

    if (!appointment) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    // Validar acceso: ADMIN, voluntario asignado o usuario dueño
    const { role, id: userId } = req.user;
    if (
      role !== "ADMIN" &&
      appointment.userId._id.toString() !== userId &&
      appointment.volunteerId._id.toString() !== userId
    ) {
      return res.status(403).json({ message: "No tienes permiso para ver esta cita" });
    }

    return res.json(appointment);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener la cita", error: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    // Validar permisos:
    if (
      role === "ADMIN" ||
      (role === "VOLUNTEER" && appointment.volunteerId.toString() === userId) ||
      (role === "USER" && appointment.userId.toString() === userId)
    ) {
      await appointment.deleteOne();

      // Crear notificación
      await createAppointmentNotification(appointment, "CANCELED");

      // -------- SOCKET.IO: Notificar a usuario y voluntario --------
      const io = getIO(req);
      if (io) {
        io.to(appointment.userId.toString()).emit("appointment:deleted", { appointmentId: appointment._id });
        io.to(appointment.volunteerId.toString()).emit("appointment:deleted", { appointmentId: appointment._id });
      }

      return res.json({ message: "Cita eliminada exitosamente", appointment });
    } else {
      return res.status(403).json({ message: "No tienes permiso para eliminar esta cita." });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error al eliminar la cita", error: error.message });
  }
};
