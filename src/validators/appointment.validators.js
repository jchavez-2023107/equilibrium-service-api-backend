import { check, param, query } from "express-validator";

import { isValidObjectId } from "mongoose";

export const createAppointmentValidators = [
  check("volunteerId")
    .notEmpty()
    .withMessage("El volunteerId es obligatorio")
    .isMongoId()
    .withMessage("El volunteerId debe ser un ID válido de MongoDB"),

  check("scheduledAt")
    .notEmpty()
    .withMessage("La fecha y hora de la cita es obligatoria")
    .isISO8601()
    .withMessage("scheduledAt debe ser una fecha válida en formato ISO8601")
    .custom((value) => {
      const date = new Date(value);
      if (date <= new Date()) {
        throw new Error("La fecha programada debe ser una fecha futura");
      }
      return true;
    }),

  check("reason")
    .optional()
    .isString()
    .withMessage("El motivo debe ser un texto"),

  check("notes")
    .optional()
    .isString()
    .withMessage("Las notas deben ser texto"),
];

// Validador para crear notificación de emergencia
export const createEmergencyNotificationValidator = [];

// Validador para aceptar notificación de emergencia
export const acceptEmergencyNotificationValidator = [
  param("id")
    .notEmpty()
    .withMessage("El id de la notificación es obligatorio")
    .isMongoId()
    .withMessage("El id debe ser un ID de Mongo válido"),
];

// Validador para marcar notificación como leída
export const markNotificationAsReadValidator = [
  param("id")
    .notEmpty()
    .withMessage("El id de la notificación es obligatorio")
    .isMongoId()
    .withMessage("El id debe ser un ID de Mongo válido"),
];

export const getAppointmentsQueryValidators = [
  query("userId")
    .optional()
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("userId debe ser un ID válido de MongoDB");
      }
      return true;
    }),

  query("status")
    .optional()
    .isIn(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"])
    .withMessage("Estado inválido, debe ser PENDING, CONFIRMED, CANCELLED o COMPLETED"),

  query("fromDate")
    .optional()
    .isISO8601()
    .withMessage("fromDate debe ser una fecha válida en formato ISO8601"),

  query("toDate")
    .optional()
    .isISO8601()
    .withMessage("toDate debe ser una fecha válida en formato ISO8601"),

  query("userName")
    .optional()
    .isString()
    .withMessage("userName debe ser una cadena de texto"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page debe ser un número entero mayor o igual a 1"),

  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("limit debe ser un número entero mayor o igual a 1"),
];

export const idParamValidator = [
  param("id")
    .notEmpty()
    .withMessage("El id es obligatorio")
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("El id debe ser un ID válido de MongoDB");
      }
      return true;
    }),
];


// export const createAppointmentValidators = [
//   check("volunteerId")
//     .notEmpty().withMessage("El ID del voluntario es obligatorio.")
//     .custom(id => isValidObjectId(id)).withMessage("ID de voluntario inválido."),

//   check("scheduledAt")
//     .notEmpty().withMessage("La fecha y hora programada es obligatoria.")
//     .isISO8601().withMessage("La fecha debe tener un formato ISO8601 válido.")
//     .custom(date => {
//       if (new Date(date) <= new Date()) {
//         throw new Error("La fecha programada debe ser futura.");
//       }
//       return true;
//     }),

//   check("reason")
//     .optional()
//     .isLength({ max: 500 }).withMessage("El motivo no debe exceder 500 caracteres."),

//   check("notes")
//     .optional()
//     .isLength({ max: 1000 }).withMessage("Las notas no deben exceder 1000 caracteres."),
// ];

// export const idParamValidator = [
//   param("id")
//     .custom(id => isValidObjectId(id))
//     .withMessage("ID inválido"),
// ];

// export const getAppointmentsQueryValidators = [
//   query("userId")
//     .optional()
//     .custom(id => isValidObjectId(id))
//     .withMessage("userId inválido"),

//   query("userName")
//     .optional()
//     .isString()
//     .withMessage("userName debe ser una cadena de texto"),

//   query("status")
//     .optional()
//     .isIn(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"])
//     .withMessage("Estado inválido"),

//   query("fromDate")
//     .optional()
//     .isISO8601()
//     .withMessage("fromDate debe ser fecha válida ISO8601"),

//   query("toDate")
//     .optional()
//     .isISO8601()
//     .withMessage("toDate debe ser fecha válida ISO8601"),

//   query("page")
//     .optional()
//     .isInt({ min: 1 })
//     .withMessage("page debe ser entero mayor o igual a 1"),

//   query("limit")
//     .optional()
//     .isInt({ min: 1, max: 100 })
//     .withMessage("limit debe ser entero entre 1 y 100"),
// ];





// // import { param } from "express-validator";
// // import { isValidObjectId } from "mongoose";

// // export const idParamValidator = [
// //   param("id")
// //     .custom(value => isValidObjectId(value))
// //     .withMessage("El ID de la notificación no es válido"),
// // ];

// // export const createEmergencyNotificationValidator = [
// //   // No se requieren campos extras en body para emergencia por ahora
// // ];

// // export const acceptEmergencyNotificationValidator = idParamValidator;

// // export const markNotificationAsReadValidator = idParamValidator;












// // import { param, validationResult  } from "express-validator";
// // import { isValidObjectId } from "../helpers/mongo-validators.js";

// // export const notificationIdValidator = [
// //   param("id").optional().custom(isValidObjectId).withMessage("ID inválido"),
// //   param("notificationId").optional().custom(isValidObjectId).withMessage("ID de notificación inválido")
// // ];

// // export const validateFields = (req, res, next) => {
// //   const errors = validationResult(req);

// //   if (!errors.isEmpty()) {
// //     return res.status(400).json({
// //       success: false,
// //       errors: errors.array()
// //     });
// //   }

// //   next();
// // };