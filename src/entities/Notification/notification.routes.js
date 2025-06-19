import { Router } from "express";
import {
  createEmergencyNotification,
  acceptEmergencyNotification,
  getUserNotifications,
  markNotificationAsRead,
} from "./notification.controller.js";

import {
  createEmergencyNotificationValidator,
  acceptEmergencyNotificationValidator,
  markNotificationAsReadValidator,
} from "../../validators/appointment.validators.js/";

import { validateJWT } from "../../middlewares/validate.jwt.js"; // Ajusta según tus middlewares
import { validateFields } from "../../middlewares/validate-fields.js"

const router = Router();

router.post(
  "/emergency",
  validateJWT,
  createEmergencyNotificationValidator,
  validateFields,
  createEmergencyNotification
);

router.patch(
  "/emergency/:id/accept",
  validateJWT,
  acceptEmergencyNotificationValidator,
  validateFields,
  acceptEmergencyNotification
);

router.get(
  "/",
  validateJWT,
  getUserNotifications
);

router.patch(
  "/:id/read",
  validateJWT,
  markNotificationAsReadValidator,
  validateFields,
  markNotificationAsRead
);

export default router;




// import { Router } from "express";
// import {
//   sendGeneralEmergencyNotification,
//   takeEmergencyNotification,
//   getNotificationsByUser,
//   markNotificationAsRead
// } from "./notification.controller.js";

// import { validateJWT } from "../../middlewares/validate.jwt.js";
// import { notificationIdValidator, validateFields } from "../../validators/notification.validators.js";
// import { canTakeEmergencies } from "../../validators/chat.validators.js";

// const router = Router();

// // Obtener todas las notificaciones del usuario autenticado
// router.get("/", [validateJWT], getNotificationsByUser);

// // Marcar una notificación como leída
// router.put(
//   "/:id/read",
//   [validateJWT, ...notificationIdValidator, validateFields],
//   markNotificationAsRead
// );

// // Enviar notificación general de emergencia a voluntarios
// router.post(
//   "/emergency-alert",
//   [validateJWT], // Solo usuario autenticado
//   sendGeneralEmergencyNotification
// );

// // Tomar una emergencia (solo 1 voluntario puede hacerlo)
// router.put(
//   "/take/:notificationId",
//   validateJWT,
//   canTakeEmergencies,
//   ...notificationIdValidator,
//   validateFields,
//   takeEmergencyNotification
// );

// export default router;
