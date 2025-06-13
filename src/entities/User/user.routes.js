import { Router } from "express";
import { validateFields } from "../../middlewares/validate-fields.js";
import { validateJWT, validateRoles } from "../../middlewares/validate.jwt.js";

import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  registerVolunteer,
  approveVolunteer,
  listVolunteers
} from "./user.controller.js";

import {
  createUserValidators,
  registerVolunteerValidators,
  idParamValidator,
  updateUserValidators
} from "../../validators/user.validators.js";

const router = Router();

/**
 * @route   POST /api/v1/users
 * @desc    Crear un nuevo usuario (rol USER por defecto)
 * @access  Público
 */
router.post(
  "/",
  [...createUserValidators, validateFields],
  createUser
);

/**
 * @route   POST /api/v1/users/volunteers
 * @desc    Registrar un voluntario con estado PENDING
 * @access  Público
 */
router.post(
  "/volunteers",
  [...registerVolunteerValidators, validateFields],
  registerVolunteer
);

/**
 * @route   GET /api/v1/users
 * @desc    Obtener lista de todos los usuarios
 * @access  ADMIN
 */
router.get(
  "/",
  [validateJWT, validateRoles("ADMIN")],
  getUsers
);

/**
 * @route   GET /api/v1/users/volunteers
 * @desc    Listar voluntarios activos, filtrar con ?need=EMERGENCY|APPOINTMENT|CHAT
 * @access  ADMIN, VOLUNTEER
 */
router.get(
  "/volunteers",
  [validateJWT, validateRoles("ADMIN", "VOLUNTEER")],
  listVolunteers
);

/**
 * @route   PUT /api/v1/users/:id/approve
 * @desc    Aprobar voluntario (status PENDING → ACTIVE)
 * @access  ADMIN
 */
router.put(
  "/:id/approve",
  [validateJWT, validateRoles("ADMIN"), ...idParamValidator, validateFields],
  approveVolunteer
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Obtener detalle de un usuario por ID (ADMIN o propio usuario)
 * @access  ADMIN, USER
 */
router.get(
  "/:id",
  [validateJWT, ...idParamValidator, validateFields],
  getUserById
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Editar usuario: ADMIN puede cambiar cualquier campo; USER solo profile
 * @access  ADMIN, USER
 */
router.put(
  "/:id",
  [validateJWT, ...updateUserValidators, validateFields],
  updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Soft-delete de usuario (status → INACTIVE), ADMIN o propio usuario
 * @access  ADMIN, USER
 */
router.delete(
  "/:id",
  [validateJWT, ...idParamValidator, validateFields],
  deleteUser
);

export default router;