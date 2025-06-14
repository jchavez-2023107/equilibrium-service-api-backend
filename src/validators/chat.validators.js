import { check, param, body } from "express-validator";
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
  // Asegurarse de que no se cree un chat consigo mismo
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
 * y que el usuario autenticado participa en él (como user o volunteer)
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
  const chat = req.chat;
  if (chat.status === "CLOSED") {
    return res
      .status(400)
      .json({ success: false, message: "El chat ya está cerrado" });
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
