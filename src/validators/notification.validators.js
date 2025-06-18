import { param } from "express-validator";
import { isValidObjectId } from "../helpers/mongo-validators.js";

export const notificationIdValidator = [
  param("id").optional().custom(isValidObjectId).withMessage("ID inválido"),
  param("notificationId").optional().custom(isValidObjectId).withMessage("ID de notificación inválido")
];
