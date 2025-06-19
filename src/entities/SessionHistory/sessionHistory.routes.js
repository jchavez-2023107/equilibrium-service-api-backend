import { Router } from "express";
import { validateJWT } from "../../middlewares/validate.jwt.js";
import { validateFields } from "../../middlewares/validate-fields.js";
import {
  getSessionHistoryByUser,
  createOrAppendSession
} from "./sessionHistory.controller.js";

import {
  userIdParamValidator,
  sessionBodyValidators
} from "../../validators/sessionHistory.validators.js";

const router = Router();

/**
 * @route   GET /api/v1/session-history/:userId
 * @desc    Obtener el historial de sesiones de un usuario
 * @access  Admin o el propio usuario
 */
router.get(
  "/:userId",
  [validateJWT, ...userIdParamValidator, validateFields],
  getSessionHistoryByUser
);

/**
 * @route   POST /api/v1/session-history/:userId
 * @desc    Agregar una sesión al historial de un usuario
 * @access  Admin o el propio usuario
 */
router.post(
  "/:userId",
  [validateJWT, ...userIdParamValidator, ...sessionBodyValidators, validateFields],
  createOrAppendSession
);

export default router;
