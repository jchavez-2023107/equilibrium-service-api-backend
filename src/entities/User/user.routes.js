import { Router } from "express";
import { validateFields } from "../../middlewares/validate-fields.js";
import { validateJWT, validateRoles } from "../../middlewares/validate.jwt.js";

import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} from "./user.controller.js";

import {
  createUserValidators,
  idParamValidator,
  updateUserValidators
} from "../../validators/user.validators.js";

const router = Router();

// Crear usuario (público)
router.post(
  "/",
  [...createUserValidators, validateFields],
  createUser
);

// Obtener todos (solo ADMIN)
router.get(
  "/",
  [validateJWT, validateRoles("ADMIN")],
  getUsers
);

// Obtener por ID (ADMIN o propio usuario)
router.get(
  "/:id",
  [validateJWT, ...idParamValidator, validateFields],
  getUserById
);

// Editar usuario (ADMIN o propio usuario)
router.put(
  "/:id",
  [validateJWT, ...updateUserValidators, validateFields],
  updateUser
);

// Soft-delete (ADMIN o propio usuario)
router.delete(
  "/:id",
  [validateJWT, ...idParamValidator, validateFields],
  deleteUser
);

export default router;
