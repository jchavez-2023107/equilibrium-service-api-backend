// src/validators/user.validators.js
import { check } from "express-validator";
import { existUsername, existEmail } from "../utils/db.validators.js";

/**
 * Validaciones para creación de usuario (POST /users)
 */
export const createUserValidators = [
  check("username")
    .notEmpty().withMessage("El nombre de usuario es obligatorio")
    .isLength({ min: 3, max: 30 }).withMessage("El nombre de usuario debe tener entre 3 y 30 caracteres")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Sólo letras, números y guión bajo")
    .custom(async value => { await existUsername(value, { uid: null }); })
    .trim(),

  check("email")
    .notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("Debe ser un email válido")
    .custom(async value => { await existEmail(value, { uid: null }); })
    .normalizeEmail(),

  check("password")
    .notEmpty().withMessage("La contraseña es obligatoria")
    .isLength({ min: 5 }).withMessage("La contraseña debe tener al menos 5 caracteres"),

  check("passwordConfirm")
    .notEmpty().withMessage("Debes confirmar la contraseña")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Las contraseñas no coinciden");
      }
      return true;
    }),

  check("role")
    .optional()
    .isIn(["ADMIN","VOLUNTEER","USER"])
    .withMessage("Rol inválido"),

  // Profile (opcional)
  check("profile.displayName")
    .optional()
    .isLength({ max: 50 }).withMessage("El nombre para mostrar es demasiado largo")
    .trim(),

  check("profile.birthDate")
    .optional()
    .isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida")
    .custom(value => {
      const fecha = new Date(value);
      const ahora = new Date();
      if (fecha > ahora) {
        throw new Error("La fecha de nacimiento no puede ser futura");
      }
      const edad = ahora.getFullYear() - fecha.getFullYear();
      if (edad < 12) {
        throw new Error("El usuario debe tener al menos 12 años");
      }
      return true;
    }),

  check("profile.contactNumber")
    .optional()
    .customSanitizer(value => {
      // Si vienen 8 dígitos juntos, inserta el guión en medio
      const digits = value.replace(/\D/g, "");
      if (digits.length === 8) return digits.replace(/(\d{4})(\d{4})/, "$1-$2");
      return value;
    })
    .matches(/^\d{4}-\d{4}$/)
      .withMessage("El número debe tener el formato 1234-5678"),

  check("profile.especialidad")
    .optional()
    .isLength({ max: 50 }).withMessage("La especialidad es demasiado larga")
    .trim(),
];

/**
 * Validaciones para parámetro :id (GET, PUT, DELETE /users/:id)
 */
export const idParamValidator = [
  check("id", "ID de usuario inválido").isMongoId()
];

/**
 * Validaciones para editar usuario (PUT /users/:id)
 */
export const updateUserValidators = [
  ...idParamValidator,

  check("username")
    .optional()
    .isLength({ min: 3, max: 30 }).withMessage("El nombre de usuario debe tener entre 3 y 30 caracteres")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Sólo letras, números y guión bajo")
    .custom(async (value, { req }) => { await existUsername(value, { uid: req.params.id }); })
    .trim(),

  check("email")
    .optional()
    .isEmail().withMessage("Debe ser un email válido")
    .custom(async (value, { req }) => { await existEmail(value, { uid: req.params.id }); })
    .normalizeEmail(),

  check("password")
    .optional()
    .isLength({ min: 5 }).withMessage("La contraseña debe tener al menos 5 caracteres"),

  // Profile (opcional)
  check("profile.displayName")
    .optional()
    .isLength({ max: 50 }).withMessage("El nombre para mostrar es demasiado largo")
    .trim(),

  check("profile.birthDate")
    .optional()
    .isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida")
    .custom(value => {
      const fecha = new Date(value);
      const ahora = new Date();
      if (fecha > ahora) {
        throw new Error("La fecha de nacimiento no puede ser futura");
      }
      const edad = ahora.getFullYear() - fecha.getFullYear();
      if (edad < 12) {
        throw new Error("El usuario debe tener al menos 12 años");
      }
      return true;
    }),

  check("profile.contactNumber")
    .optional()
    .customSanitizer(value => {
      const digits = value.replace(/\D/g, "");
      if (digits.length === 8) return digits.replace(/(\d{4})(\d{4})/, "$1-$2");
      return value;
    })
    .matches(/^\d{4}-\d{4}$/)
      .withMessage("El número debe tener el formato 1234-5678"),

  check("profile.especialidad")
    .optional()
    .isLength({ max: 50 }).withMessage("La especialidad es demasiado larga")
    .trim(),
];

/**
 * Validaciones para registro de voluntarios (POST /users/volunteers)
 */
export const registerVolunteerValidators = [
  ...createUserValidators,

  check("volunteerData.needs")
    .isArray({ min: 1 }).withMessage("Debe indicar al menos un tipo de necesidad"),

  check("volunteerData.schedules")
    .optional()
    .isArray().withMessage("El campo schedules debe ser un arreglo"),

  check("volunteerData.contactNumber")
    .optional()
    .customSanitizer(value => {
      const digits = value.replace(/\D/g, "");
      if (digits.length === 8) return digits.replace(/(\d{4})(\d{4})/, "$1-$2");
      return value;
    })
    .matches(/^\d{4}-\d{4}$/)
      .withMessage("El número del voluntario debe tener el formato 1234-5678"),

  check("volunteerData.university")
    .optional()
    .isLength({ max: 100 }).withMessage("El nombre de la universidad es demasiado largo")
    .trim(),

  check("volunteerData.graduateTerm")
    .optional()
    .isLength({ max: 50 }).withMessage("Semestre/año de graduación inválido")
    .trim(),

  check("volunteerData.hasVolunteered")
    .optional()
    .isBoolean().withMessage("Valor inválido para 'hasVolunteered'"),

  check("volunteerData.motivation")
    .optional()
    .isLength({ max: 500 }).withMessage("La motivación es demasiado larga")
    .trim(),

  check("volunteerData.availability")
    .optional()
    .isLength({ max: 100 }).withMessage("La disponibilidad es demasiado larga")
    .trim(),

  check("volunteerData.linkedIn")
    .optional()
    .matches(/^https?:\/\/(www\.)?linkedin\.com\/.*$/)
    .withMessage("URL de LinkedIn inválida"),
];