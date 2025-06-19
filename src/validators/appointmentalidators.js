import { check, param, query } from "express-validator";
import { isValidObjectId } from "mongoose";

export const createAppointmentValidators = [
  check("volunteerId")
    .notEmpty().withMessage("El ID del voluntario es obligatorio.")
    .custom(id => isValidObjectId(id)).withMessage("ID de voluntario inválido."),

  check("scheduledAt")
    .notEmpty().withMessage("La fecha y hora programada es obligatoria.")
    .isISO8601().withMessage("La fecha debe tener un formato ISO8601 válido.")
    .custom(date => {
      if (new Date(date) <= new Date()) {
        throw new Error("La fecha programada debe ser futura.");
      }
      return true;
    }),

  check("reason")
    .optional()
    .isLength({ max: 500 }).withMessage("El motivo no debe exceder 500 caracteres."),

  check("notes")
    .optional()
    .isLength({ max: 1000 }).withMessage("Las notas no deben exceder 1000 caracteres."),
];

export const idParamValidator = [
  param("id")
    .custom(id => isValidObjectId(id))
    .withMessage("ID inválido"),
];

export const getAppointmentsQueryValidators = [
  query("userId")
    .optional()
    .custom(id => isValidObjectId(id))
    .withMessage("userId inválido"),

  query("userName")
    .optional()
    .isString()
    .withMessage("userName debe ser una cadena de texto"),

  query("status")
    .optional()
    .isIn(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"])
    .withMessage("Estado inválido"),

  query("fromDate")
    .optional()
    .isISO8601()
    .withMessage("fromDate debe ser fecha válida ISO8601"),

  query("toDate")
    .optional()
    .isISO8601()
    .withMessage("toDate debe ser fecha válida ISO8601"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page debe ser entero mayor o igual a 1"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit debe ser entero entre 1 y 100"),
];
