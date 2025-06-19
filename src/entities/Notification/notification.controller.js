import { v4 as uuidv4 } from "uuid";
import Notification from "./notification.model.js";
import Chat from "../Chat/chat.model.js";

// SOCKET helper
function getIO(req) {
  return req.app && req.app.locals && req.app.locals.io;
}

/**
 * Crear notificación de emergencia (desde botón emergencia)
 */
export const createEmergencyNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const io = getIO(req);

    const chat = await Chat.findOne({ userId, status: "ACTIVE" });
    if (!chat) {
      return res.status(400).json({ success: false, message: "No tienes un chat activo para reportar la emergencia." });
    }

    chat.messages.push({
      senderId: userId,
      text: "Emergencia reportada por el usuario",
      isEmergency: true,
      isSystem: true,
      timestamp: new Date(),
    });
    await chat.save();

    const notification = new Notification({
      type: "EMERGENCY",
      recipientRoles: ["VOLUNTEER"],
      relatedChat: chat._id,
      relatedUser: userId,
      message: "Se ha reportado una emergencia. Por favor atiéndela lo antes posible.",
    });
    await notification.save();

    // -------- SOCKET.IO: Notificar a todos los voluntarios conectados --------
    if (io) {
      // Envía a todos los sockets en la room "VOLUNTEER"
      io.in("VOLUNTEER").emit("notification:new", notification);
    }

    res.status(201).json({ success: true, notification });
  } catch (err) {
    next(err);
  }
};

/**
 * Voluntario acepta la emergencia
 */
export const acceptEmergencyNotification = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const volunteerId = req.user.id;
    const io = getIO(req);

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notificación no encontrada." });
    }

    if (notification.isResolved) {
      return res.status(400).json({ success: false, message: "Esta emergencia ya fue atendida." });
    }

    let chat = await Chat.findById(notification.relatedChat);

    if (!chat) {
      chat = new Chat({
        sessionId: uuidv4(),
        userId: notification.relatedUser,
        volunteerId: volunteerId,
        status: "ACTIVE",
        type: "EMERGENCY",
        emergencyTakenBy: volunteerId,
        messages: [{
          senderId: volunteerId,
          text: "Estoy contigo, ya tomé tu emergencia.",
          isEmergency: true,
          isSystem: true,
          timestamp: new Date(),
        }],
      });
      await chat.save();
    } else {
      if (chat.emergencyTakenBy) {
        return res.status(400).json({ success: false, message: "La emergencia ya fue tomada por otro voluntario." });
      }
      chat.emergencyTakenBy = volunteerId;
      chat.volunteerId = volunteerId;
      chat.type = "EMERGENCY";
      chat.status = "ACTIVE";
      chat.messages.push({
        senderId: volunteerId,
        text: "Estoy atendiendo la emergencia.",
        isEmergency: true,
        isSystem: true,
        timestamp: new Date(),
      });
      await chat.save();
    }

    notification.isResolved = true;
    await notification.save();

    // Eliminar otras notificaciones de la misma emergencia
    await Notification.deleteMany({
      _id: { $ne: notification._id },
      type: "EMERGENCY",
      relatedChat: chat._id,
    });

    // -------- SOCKET.IO: Notificar a usuario y voluntario que la emergencia fue tomada --------
    if (io) {
      io.to(notification.relatedUser.toString()).emit("notification:emergency-taken", {
        message: "Tu emergencia ha sido atendida.",
        chatId: chat._id,
      });
      io.to(volunteerId.toString()).emit("notification:emergency-taken", {
        message: "Has tomado la emergencia.",
        chatId: chat._id,
      });
    }

    res.status(200).json({ success: true, message: "Emergencia aceptada.", chat });
  } catch (err) {
    next(err);
  }
};

/**
 * Crear notificación de nuevo mensaje en chat normal
 */
export const createChatMessageNotification = async (chat, senderId, messageText, req) => {
  let recipientId;
  if (chat.userId.toString() === senderId.toString()) {
    recipientId = chat.volunteerId;
  } else {
    recipientId = chat.userId;
  }

  if (!recipientId) return;

  const notification = new Notification({
    type: "MESSAGE",
    recipients: [recipientId],
    relatedChat: chat._id,
    relatedUser: senderId,
    message: `Nuevo mensaje: "${messageText.substring(0, 50)}"`,
  });

  await notification.save();

  // -------- SOCKET.IO: Notificar al destinatario --------
  if (req) {
    const io = getIO(req);
    if (io) {
      io.to(recipientId.toString()).emit("notification:new", notification);
    }
  }
};

/**
 * Crear notificación para citas
 * action puede ser "CREATED", "UPDATED", "CANCELED"
 */
export const createAppointmentNotification = async (appointment, action, req) => {
  const { userId, volunteerId } = appointment;
  const messageActionMap = {
    CREATED: "creó",
    UPDATED: "actualizó",
    CANCELED: "canceló",
  };
  const messageAction = messageActionMap[action] || "actualizó";

  const notification = new Notification({
    type: "APPOINTMENT",
    recipients: [userId, volunteerId].filter(Boolean),
    relatedUser: userId,
    message: `La cita ha sido ${messageAction}.`,
  });

  await notification.save();

  // -------- SOCKET.IO: Notificar a ambos --------
  if (req) {
    const io = getIO(req);
    if (io) {
      if (userId) io.to(userId.toString()).emit("notification:new", notification);
      if (volunteerId) io.to(volunteerId.toString()).emit("notification:new", notification);
    }
  }
};

/**
 * Obtener notificaciones del usuario autenticado
 */
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const notifications = await Notification.find({
      $or: [{ recipients: userId }, { recipientRoles: userRole }],
      isResolved: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
};

/**
 * Marcar notificación como leída
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notificación no encontrada." });
    }

    notification.isRead = true;
    await notification.save();

    // -------- SOCKET.IO: Opcional, podrías emitir un evento si quieres actualizar la UI del usuario
    const io = getIO(req);
    if (io) {
      for (const userId of notification.recipients || []) {
        io.to(userId.toString()).emit("notification:read", { notificationId });
      }
    }

    res.status(200).json({ success: true, message: "Notificación marcada como leída." });
  } catch (err) {
    next(err);
  }
};
