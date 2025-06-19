import { param, check } from "express-validator";
import { isValidObjectId } from "mongoose";

// Validar ID de MongoDB
export const userIdParamValidator = [
  param("userId")
    .custom((value) => isValidObjectId(value))
    .withMessage("El ID del usuario no es válido")
];

// Validaciones para los datos de sesión
export const sessionBodyValidators = [
  check("volunteerId")
    .notEmpty().withMessage("El volunteerId es obligatorio")
    .bail()
    .custom((value) => isValidObjectId(value))
    .withMessage("volunteerId debe ser un ID válido de MongoDB"),
  
  check("sessionId")
    .notEmpty()
    .withMessage("sessionId es obligatorio"),

  check("startedAt")
    .notEmpty()
    .withMessage("startedAt es obligatorio")
    .bail()
    .isISO8601()
    .withMessage("startedAt debe ser una fecha válida"),

  check("endedAt")
    .notEmpty()
    .withMessage("endedAt es obligatorio")
    .bail()
    .isISO8601()
    .withMessage("endedAt debe ser una fecha válida"),

  check("durationMinutes")
    .optional()
    .isInt({ min: 1 })
    .withMessage("durationMinutes debe ser un número entero positivo"),

  check("rating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("rating debe estar entre 1 y 5")
];
