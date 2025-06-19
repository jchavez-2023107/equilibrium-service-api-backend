import { check, param } from "express-validator";
import { isValidObjectId } from "mongoose";
import Chat from "../entities/Chat/chat.model.js";

/**
 * Valida que el campo sea un ID válido
 */
const objectIdValidator = (field) =>
  check(field)
    .custom((value) => isValidObjectId(value))
    .withMessage(`${field} debe ser un ID válido de MongoDB`);

/**
 * Valida que los IDs de user y volunteer sean válidos en la creación del chat
 */
export const createChatValidators = [
  objectIdValidator("userId"),
  objectIdValidator("volunteerId"),
  check("userId")
    .custom((value, { req }) => value !== req.body.volunteerId)
    .withMessage("userId y volunteerId no pueden ser iguales"),
];

/**
 * Valida el parámetro de ID (por ejemplo, para obtener o cerrar un chat)
 */
export const idParamValidator = [
  param("id")
    .custom((value) => isValidObjectId(value))
    .withMessage("El ID del chat no es válido"),
];

/**
 * Middleware personalizado para validar que el chat existe
 * y que el usuario autenticado participa en él
 */
export const chatExistAndUserInvolved = async (req, res, next) => {
  const { id } = req.params;

  const chat = await Chat.findById(id);
  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat no encontrado" });
  }

  const uid = req.user.id;
  const userId = chat.userId?.toString();
  const volunteerId = chat.volunteerId?.toString();
  const emergencyTakenBy = chat.emergencyTakenBy?.toString();

  console.log("======= DEBUG ACCESS =======");
  console.log("Usuario autenticado:", uid);
  console.log("Rol:", req.user.role);
  console.log("Chat.userId:", userId);
  console.log("Chat.volunteerId:", volunteerId);
  console.log("Chat.emergencyTakenBy:", emergencyTakenBy);

  if (
    userId !== uid &&
    volunteerId !== uid &&
    emergencyTakenBy !== uid &&
    req.user.role !== "ADMIN"
  ) {
    return res.status(403).json({ success: false, message: "No tienes acceso a este chat" });
  }

  req.chat = chat;
  next();
};


/**
 * Middleware para asegurar que el chat aún no está cerrado
 */
export const chatIsOpenValidator = (req, res, next) => {
  const chat = req.chat;
  if (chat.status === "CLOSED" || chat.status === "ENDED") {
    return res.status(400).json({ success: false, message: "El chat ya está cerrado" });
  }
  next();
};

export const addMessageValidators = [
  check("text")
    .trim()
    .notEmpty()
    .withMessage("El texto del mensaje es obligatorio"),
  check("isEmergency")
    .optional()
    .isBoolean()
    .withMessage("isEmergency debe ser un valor booleano"),
];

export const loadChat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat no encontrado" });
    }

    req.chat = chat;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validación para evitar múltiples emergencias seguidas por el mismo usuario
 */
export const limitEmergencyTriggerValidator = async (req, res, next) => {
  const userId = req.user.id;

  const chat = await Chat.findOne({ userId, status: "ACTIVE" });

  if (!chat) {
    return res.status(404).json({ success: false, message: "No tienes un chat activo para emergencias" });
  }

  const now = new Date();
  const recentEmergency = chat.messages
    .filter(msg => msg.isEmergency)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  if (recentEmergency) {
    const diffMs = now - new Date(recentEmergency.timestamp);
    const diffMinutes = diffMs / 1000 / 60;

    if (diffMinutes < 5) {
      return res.status(429).json({
        success: false,
        message: "Ya reportaste una emergencia hace poco. Espera unos minutos para volver a enviar otra."
      });
    }
  }

  req.chat = chat;
  next();
};


export const canTakeEmergencies = (req, res, next) => {
  const user = req.user;

  if (
    user.role !== "VOLUNTEER" ||
    !user.volunteerData ||
    !Array.isArray(user.volunteerData.needs) ||
    !user.volunteerData.needs.includes("EMERGENCY")
  ) {
    return res.status(403).json({
      success: false,
      message: "No estás autorizado para tomar emergencias"
    });
  }

  next();
};