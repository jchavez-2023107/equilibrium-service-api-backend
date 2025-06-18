import { Router } from "express";
import {
  sendGeneralEmergencyNotification,
  takeEmergencyNotification,
  getNotificationsByUser,
  markNotificationAsRead
} from "../entities/Notification/notification.controller.js";

import { validateJWT } from "../middlewares/validateJWT.js";
import { notificationIdValidator } from "../entities/Notification/notification.validators.js";
import { validateFields } from "../middlewares/validateFields.js";

const router = Router();

// Obtener todas las notificaciones del usuario autenticado
router.get("/", [validateJWT], getNotificationsByUser);

// Marcar una notificación como leída
router.put(
  "/:id/read",
  [validateJWT, ...notificationIdValidator, validateFields],
  markNotificationAsRead
);

// Enviar notificación general de emergencia a voluntarios
router.post(
  "/emergency-alert",
  [validateJWT], // Solo usuario autenticado
  sendGeneralEmergencyNotification
);

// Tomar una emergencia (solo 1 voluntario puede hacerlo)
router.put(
  "/take/:notificationId",
  [validateJWT, ...notificationIdValidator, validateFields],
  takeEmergencyNotification
);

export default router;
