import { Router } from "express";
import { validateFields } from "../../middlewares/validate-fields.js";
import { validateJWT, validateRoles } from "../../middlewares/validate.jwt.js";

import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  getAppointmentById,
} from "./citas.controller.js";

import {
  createAppointmentValidators,
  idParamValidator,
  getAppointmentsQueryValidators,
} from "../../validators/appointment.validators.js";

const router = Router();

/**
 * Crear cita - Usuarios con cualquier rol
 */
router.post(
  "/",
  [validateJWT, validateRoles("ADMIN", "VOLUNTEER", "USER"), ...createAppointmentValidators, validateFields],
  createAppointment
);

/**
 * Listar citas con filtros - ADMIN, VOLUNTEER, USER
 */
router.get(
  "/",
  [validateJWT, validateRoles("ADMIN", "VOLUNTEER", "USER"), ...getAppointmentsQueryValidators, validateFields],
  getAppointments
);

/**
 * Obtener cita por ID - ADMIN, VOLUNTEER, USER
 */
router.get(
  "/:id",
  [validateJWT, ...idParamValidator, validateFields],
  getAppointmentById
);

/**
 * Eliminar cita por ID - ADMIN o usuario dueño
 */
router.delete(
  "/:id",
  [validateJWT, ...idParamValidator, validateFields],
  deleteAppointment
);

export default router;
