import Chat from "./chat.model.js";
import User from "../User/user.model.js";
import { v4 as uuidv4 } from "uuid";
import { createEmergencyAlertNotification, notifyEmergencyTaken } from "../Notification/notification.controller.js";

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

    // Verifica si el usuario está autorizado para enviar mensajes
    if (
      chat.userId.toString() !== senderId &&
      chat.volunteerId?.toString() !== senderId &&
      chat.emergencyTakenBy?.toString() !== senderId
    ) {
      return res.status(403).json({
        success: false,
        message: "No estás autorizado para enviar mensajes en este chat"
      });
    }

    if (chat.status === "ENDED") {
      return res.status(400).json({
        success: false,
        message: "El chat está cerrado"
      });
    }

    chat.messages.push({
      senderId,
      text,
      isEmergency,
      timestamp: new Date()
    });

    await chat.save();

    await chat.populate([
      { path: "userId", select: "_id username" },
      { path: "volunteerId", select: "_id username" }
    ]);

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
    const requester = req.user;

    const chat = await Chat.findById(id)
      .populate("userId", "_id username")
      .populate("volunteerId", "_id username");

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat no encontrado" });
    }

    if (
      chat.userId.toString() !== requester.id &&
      chat.volunteerId?.toString() !== requester.id &&
      chat.emergencyTakenBy?.toString() !== requester.id
    ) {
      return res.status(403).json({ success: false, message: "No tienes acceso a este chat" });
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
    await chat.save();

    await chat.populate([
      { path: "userId", select: "_id username" },
      { path: "volunteerId", select: "_id username" }
    ]);

    res.json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

/**
 * triggerEmergency: agrega mensaje automático de emergencia y notifica voluntarios.
 */
export const triggerEmergency = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Buscar chat abierto existente
    const chat = await Chat.findOne({ userId, status: "ACTIVE" });

    if (!chat) {
      return res.status(400).json({ success: false, message: "No tienes un chat activo para reportar la emergencia." });
    }

    chat.messages.push({
      senderId: req.user.id, // o null
      text: "Emergencia reportada por el usuario",
      isEmergency: true,
      isSystem: true,
      timestamp: new Date()
    }); 

    await chat.save();

    await createEmergencyAlertNotification(chat, userId);

    res.status(201).json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

/**
 * acceptEmergency: permite a un voluntario tomar control de la emergencia.
 */
export const acceptEmergency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const volunteerId = req.user.id;

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat no encontrado" });
    }

    const hasEmergency = chat.messages.some(m => m.isEmergency);

    if (!hasEmergency) {
      return res.status(400).json({ success: false, message: "Este chat no tiene emergencia activa" });
    }

    if (chat.emergencyTakenBy) {
      return res.status(400).json({ success: false, message: "Emergencia ya fue tomada" });
    }

    chat.emergencyTakenBy = volunteerId;
    chat.volunteerId = volunteerId;
    await chat.save();

    await notifyEmergencyTaken(chat._id, volunteerId);

    res.status(200).json({ success: true, message: "Emergencia aceptada", chat });
  } catch (err) {
    next(err);
  }
};
