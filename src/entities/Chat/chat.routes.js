import { Router } from "express";
import {
  createChat,
  addMessageToChat,
  getChats,
  getChatById,
  closeChat,
  triggerEmergency,
  acceptEmergency
} from "./chat.controller.js";

import { validateJWT } from "../../middlewares/validate.jwt.js";
import { validateFields } from "../../middlewares/validate-fields.js";
import { validateRoles } from "../../middlewares/validate-roles.js";

import {
  createChatValidators,
  idParamValidator,
  addMessageValidators,
  chatExistAndUserInvolved,
  chatIsOpenValidator,
  limitEmergencyTriggerValidator,
  canAcceptEmergency
} from "../../validators/chat.validators.js";

const router = Router();

/**
 * Crear un nuevo chat (permitido: ADMIN, USER, VOLUNTEER)
 */
router.post(
  "/",
  validateJWT,
  validateRoles("ADMIN", "USER", "VOLUNTEER"),
  createChatValidators,
  validateFields,
  createChat
);

/**
 * Obtener todos los chats del usuario autenticado
 */
router.get(
  "/",
  validateJWT,
  getChats
);

/**
 * Obtener un chat por ID (solo si el usuario participa o es ADMIN)
 */
router.get(
  "/:id",
  validateJWT,
  idParamValidator,
  validateFields,
  chatExistAndUserInvolved,
  getChatById
);

/**
 * Agregar un mensaje al chat (participantes o admin)
 */
router.post(
  "/:id/message",
  validateJWT,
  idParamValidator,
  addMessageValidators,
  validateFields,
  chatExistAndUserInvolved,
  chatIsOpenValidator,
  addMessageToChat
);

/**
 * Cerrar un chat (USER, VOLUNTEER o ADMIN)
 */
router.patch(
  "/:id/close",
  validateJWT,
  idParamValidator,
  validateFields,
  chatExistAndUserInvolved,
  chatIsOpenValidator,
  closeChat
);

/**
 * Reportar una emergencia (solo USER o ADMIN)
 */
router.post(
  "/trigger-emergency",
  validateJWT,
  validateRoles("USER", "ADMIN"),
  limitEmergencyTriggerValidator,
  triggerEmergency
);

/**
 * Aceptar una emergencia (solo VOLUNTEER o ADMIN)
 */
router.post(
  "/:id/accept-emergency",
  validateJWT,
  validateRoles("VOLUNTEER", "ADMIN"),
  idParamValidator,
  validateFields,
  chatExistAndUserInvolved,
  canAcceptEmergency,
  acceptEmergency
);

export default router;
