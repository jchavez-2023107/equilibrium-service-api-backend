import { check } from "express-validator";
import { existUsername, existEmail } from "../utils/db.validators.js";

/**
 * Validaciones para creación de usuario (POST /users)
 */
export const createUserValidators = [
  check("username")
    .notEmpty().withMessage("El username es obligatorio")
    .isLength({ min: 3, max: 30 }).withMessage("Username entre 3 y 30 caracteres")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Sólo letras, números y guión bajo")
    .custom(async value => {
      await existUsername(value, { uid: null });
    }),

  check("email")
    .notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("Debe ser un email válido")
    .custom(async value => {
      await existEmail(value, { uid: null });
    }),

  check("password")
    .notEmpty().withMessage("La contraseña es obligatoria")
    .isLength({ min: 8 }).withMessage("Mínimo 8 caracteres")
    .matches(/(?=.*[A-Z])/, "g").withMessage("Debe incluir al menos una mayúscula")
    .matches(/(?=.*[0-9])/, "g").withMessage("Debe incluir al menos un número"),

  check("role")
    .optional()
    .isIn(["ADMIN","VOLUNTEER","USER"])
    .withMessage("Rol inválido"),

  // Profile (opcional)
  check("profile.displayName")
    .optional()
    .isLength({ max: 50 }).withMessage("displayName demasiado largo"),
  check("profile.birthDate")
    .optional()
    .isISO8601().withMessage("birthDate debe ser fecha ISO"),
  check("profile.contactNumber")
    .optional()
    .matches(/^[0-9+\- ]{7,20}$/).withMessage("Número de contacto inválido"),
  check("profile.especialidad")
    .optional()
    .isLength({ max: 50 }).withMessage("especialidad demasiado larga"),

  // Lanza al final la verificación
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
  // Mismo id
  ...idParamValidator,

  // Opcionales para ADMIN o propio usuario
  check("username")
    .optional()
    .isLength({ min: 3, max: 30 }).withMessage("Username entre 3 y 30 caracteres")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Sólo letras, números y guión bajo")
    .custom(async (value, { req }) => {
      await existUsername(value, { uid: req.params.id });
    }),

  check("email")
    .optional()
    .isEmail().withMessage("Debe ser un email válido")
    .custom(async (value, { req }) => {
      await existEmail(value, { uid: req.params.id });
    }),

  check("password")
    .optional()
    .isLength({ min: 8 }).withMessage("Mínimo 8 caracteres")
    .matches(/(?=.*[A-Z])/, "g").withMessage("Debe incluir al menos una mayúscula")
    .matches(/(?=.*[0-9])/, "g").withMessage("Debe incluir al menos un número"),

  check("role")
    .optional()
    .isIn(["ADMIN","VOLUNTEER","USER"])
    .withMessage("Rol inválido"),

  check("status")
    .optional()
    .isIn(["ACTIVE","INACTIVE"])
    .withMessage("Status inválido"),

  check("profile.displayName")
    .optional()
    .isLength({ max: 50 }).withMessage("displayName demasiado largo"),

  // Al final, dejamos que el middleware de campos chequee todo
];
