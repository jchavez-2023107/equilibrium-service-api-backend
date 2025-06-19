import { v4 as uuidv4 } from "uuid";
import Notification from "./notification.model.js";
import Chat from "../Chat/chat.model.js";

/**
 * Crear notificación de emergencia (desde botón emergencia)
 */
export const createEmergencyNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;

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

    await Notification.deleteMany({
      _id: { $ne: notification._id },
      type: "EMERGENCY",
      relatedChat: chat._id,
    });

    res.status(200).json({ success: true, message: "Emergencia aceptada.", chat });
  } catch (err) {
    next(err);
  }
};

/**
 * Crear notificación de nuevo mensaje en chat normal
 */
export const createChatMessageNotification = async (chat, senderId, messageText) => {
  // Notifica al otro usuario en el chat que recibió un mensaje
  let recipientId;
  if (chat.userId.toString() === senderId.toString()) {
    recipientId = chat.volunteerId;
  } else {
    recipientId = chat.userId;
  }

  if (!recipientId) return; // No hay destinatario (ej. chat sin voluntario asignado)

  const notification = new Notification({
    type: "MESSAGE",
    recipients: [recipientId],
    relatedChat: chat._id,
    relatedUser: senderId,
    message: `Nuevo mensaje: "${messageText.substring(0, 50)}"`,
  });

  await notification.save();
};

/**
 * Crear notificación para citas
 * action puede ser "CREATED", "UPDATED", "CANCELED"
 */
export const createAppointmentNotification = async (appointment, action) => {
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

    res.status(200).json({ success: true, message: "Notificación marcada como leída." });
  } catch (err) {
    next(err);
  }
};



// import Notification from "../Notification/notification.model.js";
// import User from "../User/user.model.js";
// import { handleEmergencyChatAfterTake } from "../Chat/chat.controller.js";

// export const createMessageNotification = async ({ chat, senderId, isEmergency }) => {
//   const receiverId =
//     chat.userId.toString() === senderId ? chat.volunteerId : chat.userId;

//   const sender = await User.findById(senderId);

//   const notification = new Notification({
//     userId: receiverId,
//     type: isEmergency ? "EMERGENCY_MESSAGE" : "NEW_MESSAGE",
//     title: isEmergency ? "Mensaje de emergencia" : "Nuevo mensaje en el chat",
//     body: `${sender.username} te ha enviado un mensaje${isEmergency ? " de emergencia" : ""}`,
//     data: {
//       chatId: chat._id,
//       sessionId: chat.sessionId,
//     },
//   });

//   await notification.save();
// };

// // Notificación general a voluntarios que aceptan emergencias
// export const sendGeneralEmergencyNotification = async (req, res, next) => {
//   try {
//     const userId = req.user.id;

//     const volunteers = await User.find(
//       { role: "VOLUNTEER", "volunteerData.needs": "EMERGENCY" },
//       "_id"
//     );

//     const notifications = volunteers.map((vol) => ({
//       userId: vol._id,
//       type: "EMERGENCY_MESSAGE",
//       title: "Emergencia general",
//       body: "Hay una nueva emergencia. Haz clic para atenderla.",
//       data: { requesterId: userId, taken: false },
//     }));

//     await Notification.insertMany(notifications);

//     res
//       .status(200)
//       .json({ success: true, message: "Notificaciones enviadas a voluntarios" });
//   } catch (err) {
//     next(err);
//   }
// };

// // Toma de emergencia: solo un voluntario puede tomarla
// export const takeEmergencyNotification = async (req, res, next) => {
//   try {
//     const volunteerId = req.user.id;
//     const { notificationId } = req.params;

//     const notification = await Notification.findOne({
//       _id: notificationId,
//       userId: volunteerId,
//       type: "EMERGENCY_MESSAGE",
//       "data.taken": false,
//     });

//     if (!notification) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Emergencia ya fue tomada o no existe" });
//     }

//     // Marcar como tomada
//     notification.data.taken = true;
//     await notification.save();

//     // Eliminar la notificación de los demás voluntarios
//     await Notification.deleteMany({
//       type: "EMERGENCY_MESSAGE",
//       "data.taken": false,
//       _id: { $ne: notification._id },
//     });

//     // Crear o actualizar chat con el voluntario que tomó la emergencia
//     await handleEmergencyChatAfterTake(notification.data.requesterId, volunteerId);

//     res.status(200).json({ success: true, message: "Emergencia tomada con éxito" });
//   } catch (err) {
//     next(err);
//   }
// };

// // Obtener notificaciones por usuario
// export const getNotificationsByUser = async (req, res, next) => {
//   try {
//     const userId = req.user.id;

//     const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

//     res.json({ success: true, notifications });
//   } catch (err) {
//     next(err);
//   }
// };

// // Marcar notificación como leída
// export const markNotificationAsRead = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const notification = await Notification.findOne({ _id: id, userId });

//     if (!notification) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Notificación no encontrada" });
//     }

//     notification.read = true;
//     await notification.save();

//     res.json({ success: true, notification });
//   } catch (err) {
//     next(err);
//   }
// };

// export const createEmergencyAlertNotification = async (chat, requesterId) => {
//   const volunteers = await User.find(
//     { role: "VOLUNTEER", status: "ACTIVE", "volunteerData.needs": "EMERGENCY" },
//     "_id"
//   );

//   const notifications = volunteers.map((v) => ({
//     userId: v._id,
//     type: "EMERGENCY_ALERT",
//     title: "Emergencia disponible",
//     body: "Un usuario ha reportado una emergencia. Puedes atenderla.",
//     data: { chatId: chat._id, requesterId, taken: false },
//   }));

//   await Notification.insertMany(notifications);
// };

// export const notifyEmergencyTaken = async (chatId, volunteerId) => {
//   await Notification.deleteMany({
//     type: "EMERGENCY_ALERT",
//     "data.chatId": chatId,
//     userId: { $ne: volunteerId },
//   });

//   await Notification.create({
//     userId: volunteerId,
//     type: "EMERGENCY_TAKEN",
//     title: "Has tomado la emergencia",
//     body: "Ahora estás a cargo de esta emergencia.",
//     data: { chatId },
//   });
// };


