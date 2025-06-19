import Notification from "../Notification/notification.model.js";
import User from "../User/user.model.js";
import { handleEmergencyChatAfterTake } from "../Chat/chat.controller.js";

// Notificación de nuevo mensaje en chat
export const createMessageNotification = async ({ chat, senderId, isEmergency, req = null }) => {
  const receiverId =
    chat.userId.toString() === senderId ? chat.volunteerId : chat.userId;

  const sender = await User.findById(senderId);

  const notification = new Notification({
    userId: receiverId,
    type: isEmergency ? "EMERGENCY_MESSAGE" : "NEW_MESSAGE",
    title: isEmergency ? "Mensaje de emergencia" : "Nuevo mensaje en el chat",
    body: `${sender.username} te ha enviado un mensaje${isEmergency ? " de emergencia" : ""}`,
    data: {
      chatId: chat._id,
      sessionId: chat.sessionId,
    },
  });

  await notification.save();

  // -------- SOCKET.IO: Notifica al destinatario en tiempo real --------
  if (req && req.app && req.app.locals.io) {
    req.app.locals.io.to(receiverId.toString()).emit("notification:new", notification);
  }
};

// Notificación general a voluntarios que aceptan emergencias
export const sendGeneralEmergencyNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const volunteers = await User.find(
      { role: "VOLUNTEER", "volunteerData.needs": "EMERGENCY" },
      "_id"
    );

    const notifications = volunteers.map((vol) => ({
      userId: vol._id,
      type: "EMERGENCY_MESSAGE",
      title: "Emergencia general",
      body: "Hay una nueva emergencia. Haz clic para atenderla.",
      data: { requesterId: userId, taken: false },
    }));

    const inserted = await Notification.insertMany(notifications);

    // -------- SOCKET.IO: Notifica a todos los voluntarios EMERGENCY --------
    if (req.app && req.app.locals.io) {
      for (const n of inserted) {
        req.app.locals.io.to(n.userId.toString()).emit("notification:new", n);
      }
    }

    res.status(200).json({ success: true, message: "Notificaciones enviadas a voluntarios" });
  } catch (err) {
    next(err);
  }
};

// Toma de emergencia: solo un voluntario puede tomarla
export const takeEmergencyNotification = async (req, res, next) => {
  try {
    const volunteerId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: volunteerId,
      type: "EMERGENCY_MESSAGE",
      "data.taken": false,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Emergencia ya fue tomada o no existe" });
    }

    // Marcar como tomada
    notification.data.taken = true;
    await notification.save();

    // Eliminar la notificación de los demás voluntarios
    await Notification.deleteMany({
      type: "EMERGENCY_MESSAGE",
      "data.taken": false,
      _id: { $ne: notification._id },
    });

    // Crear o actualizar chat con el voluntario que tomó la emergencia
    await handleEmergencyChatAfterTake(notification.data.requesterId, volunteerId);

    // -------- SOCKET.IO: Notifica al voluntario que tomó la emergencia --------
    if (req.app && req.app.locals.io) {
      req.app.locals.io.to(volunteerId.toString()).emit("notification:emergency_taken", notification);
    }

    res.status(200).json({ success: true, message: "Emergencia tomada con éxito" });
  } catch (err) {
    next(err);
  }
};

// Obtener notificaciones por usuario
export const getNotificationsByUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notificación no encontrada" });
    }

    notification.read = true;
    await notification.save();

    // -------- SOCKET.IO: Notifica cambio de estado de notificación --------
    if (req.app && req.app.locals.io) {
      req.app.locals.io.to(userId.toString()).emit("notification:read", notification);
    }

    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
};

export const createEmergencyAlertNotification = async (chat, requesterId, req = null) => {
  const volunteers = await User.find(
    { role: "VOLUNTEER", status: "ACTIVE", "volunteerData.needs": "EMERGENCY" },
    "_id"
  );

  const notifications = volunteers.map((v) => ({
    userId: v._id,
    type: "EMERGENCY_ALERT",
    title: "Emergencia disponible",
    body: "Un usuario ha reportado una emergencia. Puedes atenderla.",
    data: { chatId: chat._id, requesterId, taken: false },
  }));

  const inserted = await Notification.insertMany(notifications);

  // -------- SOCKET.IO: Notifica a todos los voluntarios EMERGENCY --------
  if (req && req.app && req.app.locals.io) {
    for (const n of inserted) {
      req.app.locals.io.to(n.userId.toString()).emit("notification:new", n);
    }
  }
};

export const notifyEmergencyTaken = async (chatId, volunteerId, req = null) => {
  await Notification.deleteMany({
    type: "EMERGENCY_ALERT",
    "data.chatId": chatId,
    userId: { $ne: volunteerId },
  });

  const notification = await Notification.create({
    userId: volunteerId,
    type: "EMERGENCY_TAKEN",
    title: "Has tomado la emergencia",
    body: "Ahora estás a cargo de esta emergencia.",
    data: { chatId },
  });

  // -------- SOCKET.IO: Notifica solo al voluntario que tomó la emergencia --------
  if (req && req.app && req.app.locals.io) {
    req.app.locals.io.to(volunteerId.toString()).emit("notification:emergency_taken", notification);
  }
};
