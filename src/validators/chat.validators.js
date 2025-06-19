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

  if (
    userId !== uid &&
    volunteerId !== uid &&
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
  const { status } = req.chat;
  // Solo permitimos mensajes si el chat está ACTIVO
  if (status !== "ACTIVE") {
    return res
      .status(400)
      .json({ success: false, message: "No puedes enviar mensajes en un chat que no está activo" });
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

/**
 * Valida que el chat:
 *  - Sea de tipo EMERGENCY
 *  - No tenga ya un emergencyTakenBy
 *  - (Opcional) que siga ACTIVE
 */
export const canAcceptEmergency = (req, res, next) => {
  const { type, emergencyTakenBy, status } = req.chat;

  if (type !== "EMERGENCY") {
    return res
      .status(400)
      .json({ success: false, message: "Este chat no está marcado como emergencia" });
  }

  if (emergencyTakenBy) {
    return res
      .status(400)
      .json({ success: false, message: "La emergencia ya ha sido aceptada por otro voluntario" });
  }

  // opcional: asegurar que siga activo
  if (status !== "ACTIVE") {
    return res
      .status(400)
      .json({ success: false, message: "No puedes aceptar una emergencia en un chat inactivo" });
  }

  next();
};