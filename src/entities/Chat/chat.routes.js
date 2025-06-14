import { Router } from "express";
import { validateJWT } from "../../middlewares/validate.jwt.js";
import { validateFields } from "../../middlewares/validate-fields.js";

import {
  createChat,
  getChats,
  getChatById,
  closeChat,
  addMessageToChat
} from "./chat.controller.js";

import {
  createChatValidators,
  idParamValidator,
  addMessageValidators,
  chatExistAndUserInvolved,
  loadChat,
  chatIsOpenValidator
} from "../../validators/chat.validators.js";

const router = Router();

/**
 * @route   POST /api/v1/chats
 * @desc    Iniciar un nuevo chat entre un USER y un VOLUNTEER
 * @access  Autenticado (ADMIN, USER, VOLUNTEER)
 */
router.post(
  "/",
  [validateJWT, ...createChatValidators, validateFields],
  createChat
);

/**
 * @route   GET /api/v1/chats
 * @desc    Listar todos los chats del usuario autenticado
 * @access  Autenticado
 */
router.get(
  "/",
  [validateJWT],
  getChats
);

/**
 * @route   GET /api/v1/chats/:id
 * @desc    Obtener un chat específico por ID (solo si participa)
 * @access  Autenticado
 */
router.get(
  "/:id/Id",
  [validateJWT, ...idParamValidator, validateFields],
  getChatById
);

/**
 * @route   PUT /api/v1/chats/:id/close
 * @desc    Cerrar un chat (status → CLOSED)
 * @access  Participantes o ADMIN
 */
router.put(
  "/:id/close",
  [validateJWT, ...idParamValidator, validateFields],
  closeChat
);

/**
 * @route   POST /api/v1/chats/:id/messages
 * @desc    Añadir un mensaje a un chat existente
 * @access  Participantes o ADMIN
 */
router.post(
  "/:id/messages",
  [
    validateJWT,
    ...idParamValidator,
    ...addMessageValidators,
    loadChat,                 // ✅ Cargar el chat primero
    chatExistAndUserInvolved, // ✅ Validar si el usuario participa
    chatIsOpenValidator,      // ✅ Verificar si el chat está activo
    validateFields
  ],
  addMessageToChat
);


export default router;
