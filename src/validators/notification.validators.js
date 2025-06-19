import { param, validationResult  } from "express-validator";
import { isValidObjectId } from "../helpers/mongo-validators.js";

export const notificationIdValidator = [
  param("id").optional().custom(isValidObjectId).withMessage("ID inválido"),
  param("notificationId").optional().custom(isValidObjectId).withMessage("ID de notificación inválido")
];

export const validateFields = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  next();
};