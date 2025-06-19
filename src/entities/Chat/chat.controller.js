import Chat from "./chat.model.js";
import User from "../User/user.model.js";
import { v4 as uuidv4 } from "uuid";
import { createChatMessageNotification } from "../Notification/notification.controller.js";

// UTILIDAD: Obtener instancia de socket.io desde req
function getIO(req) {
  return req.app && req.app.locals && req.app.locals.io;
}

/**
 * createChat: Inicia un nuevo chat entre un usuario y un voluntario.
 */
export const createChat = async (req, res, next) => {
  try {
    const { userId, volunteerId } = req.body;

    const [user, volunteer] = await Promise.all([
      User.findById(userId),
      User.findById(volunteerId)
    ]);

    if (!user || !volunteer) {
      return res.status(404).json({ success: false, message: "Usuario(s) no encontrado(s)" });
    }

    if (user.role !== "USER" || volunteer.role !== "VOLUNTEER") {
      return res.status(400).json({ success: false, message: "Roles incorrectos para iniciar chat" });
    }

    const existing = await Chat.findOne({
      userId: userId,
      volunteerId: volunteerId,
      status: "ACTIVE"
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "Ya existe un chat activo entre estos usuarios" });
    }

    const newChat = new Chat({
      sessionId: uuidv4(),
      userId,
      volunteerId,
      status: "ACTIVE"
    });

    await newChat.save();
    await newChat.populate([
      { path: "userId", select: "_id username" },
      { path: "volunteerId", select: "_id username" }
    ]);

    // -------- SOCKET.IO: Notifica a ambos usuarios que hay nuevo chat --------
    const io = getIO(req);
    if (io) {
      io.to(userId.toString()).emit("chat:new", newChat);
      io.to(volunteerId.toString()).emit("chat:new", newChat);
    }

    res.status(201).json({ success: true, chat: newChat });
  } catch (err) {
    next(err);
  }
};

/**
 * addMessageToChat: Agrega un mensaje al chat.
 */
export const addMessageToChat = async (req, res, next) => {
  try {
    const chat = req.chat;
    const senderId = req.user.id;
    const { text, isEmergency = false } = req.body;

    // Verificar que el usuario esté autorizado a enviar mensajes en este chat
    if (
      chat.userId.toString() !== senderId &&
      chat.volunteerId?.toString() !== senderId &&
      chat.emergencyTakenBy?.toString() !== senderId
    ) {
      return res.status(403).json({
        success: false,
        message: "No estás autorizado para enviar mensajes en este chat",
      });
    }

    // Verificar que el chat esté activo
    if (chat.status === "ENDED") {
      return res.status(400).json({
        success: false,
        message: "El chat está cerrado",
      });
    }

    // Agregar el nuevo mensaje
    chat.messages.push({
      senderId,
      text,
      isEmergency,
      timestamp: new Date(),
    });

    await chat.save();

    // Crear la notificación de nuevo mensaje para el otro participante
    await createChatMessageNotification(chat, senderId, text);

    // Poblar datos de usuario y voluntario para respuesta
    await chat.populate([
      { path: "userId", select: "_id username" },
      { path: "volunteerId", select: "_id username" },
    ]);

    // -------- SOCKET.IO: Notifica a ambos usuarios del nuevo mensaje --------
    const io = getIO(req);
    if (io) {
      const userId = chat.userId?._id?.toString() || chat.userId.toString();
      const volunteerId = chat.volunteerId?._id?.toString() || chat.volunteerId?.toString();

      // Último mensaje (recién agregado)
      const lastMsg = chat.messages.at(-1);

      io.to(userId).emit("chat:message", {
        chatId: chat._id,
        message: lastMsg,
      });
      if (volunteerId)
        io.to(volunteerId).emit("chat:message", {
          chatId: chat._id,
          message: lastMsg,
        });
      // Si hay emergencyTakenBy diferente al volunteerId, notifícalo también
      if (
        chat.emergencyTakenBy &&
        chat.emergencyTakenBy.toString() !== volunteerId
      ) {
        io.to(chat.emergencyTakenBy.toString()).emit("chat:message", {
          chatId: chat._id,
          message: lastMsg,
        });
      }
    }

    res.status(200).json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

/**
 * getChats: Lista los chats del usuario autenticado.
 */
export const getChats = async (req, res, next) => {
  try {
    const { id, role } = req.user;

    const filter = {
      status: "ACTIVE",
      ...(role === "VOLUNTEER"
        ? { volunteerId: id }
        : role === "ADMIN"
          ? {}
          : { userId: id })
    };

    const chats = await Chat.find(filter)
      .populate("userId", "_id username")
      .populate("volunteerId", "_id username");

    res.json({ success: true, chats });
  } catch (err) {
    next(err);
  }
};

/**
 * getChatById: Devuelve un chat si el usuario participa en él.
 */
export const getChatById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id)
      .populate("userId", "_id username")
      .populate("volunteerId", "_id username");

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat no encontrado" });
    }

    res.json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

/**
 * closeChat: Cierra el chat (status → ENDED).
 */
export const closeChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat no encontrado" });
    }

    if (
      chat.userId.toString() !== requester.id &&
      chat.volunteerId?.toString() !== requester.id &&
      requester.role !== "ADMIN"
    ) {
      return res.status(403).json({ success: false, message: "No autorizado para cerrar este chat" });
    }

    chat.status = "ENDED";
    chat.endedAt = new Date();
    await chat.save();

    await chat.populate([
      { path: "userId", select: "_id username" },
      { path: "volunteerId", select: "_id username" }
    ]);

    // -------- SOCKET.IO: Notifica a ambos que el chat fue cerrado --------
    const io = getIO(req);
    if (io) {
      const userId = chat.userId?._id?.toString() || chat.userId.toString();
      const volunteerId = chat.volunteerId?._id?.toString() || chat.volunteerId?.toString();

      io.to(userId).emit("chat:closed", { chatId: chat._id });
      if (volunteerId)
        io.to(volunteerId).emit("chat:closed", { chatId: chat._id });
      // Si hay emergencyTakenBy diferente al volunteerId, notifícalo también
      if (
        chat.emergencyTakenBy &&
        chat.emergencyTakenBy.toString() !== volunteerId
      ) {
        io.to(chat.emergencyTakenBy.toString()).emit("chat:closed", { chatId: chat._id });
      }
    }

    res.json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};