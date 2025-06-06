// src/entities/User/user.routes.js
import { Router } from "express";
import { check } from "express-validator";

import { createUser } from "./user.controller.js";
import { existUsername, existEmail } from "../../utils/db.validators.js";
import { validateFields } from "../../middlewares/validate-fields.js";

const router = Router();

/**
 * @route   POST /api/v1/users
 * @desc    Crear un nuevo usuario
 * @body    { username, email, password, [role], [profile] }
 * @access  Público (o ADMIN según la siguiente asignación; ahorita lo dejamos público)
 */
router.post(
  "/",
  [
    check("username", "Username is required").not().isEmpty(),
    check("email", "Must be a valid email").isEmail(),
    check("password", "Password is required").not().isEmpty(),

    // Validación personalizada de unicidad:
    check("username").custom(async (value) => {
      // { uid: null } porque es creación
      await existUsername(value, { uid: null });
    }),
    check("email").custom(async (value) => {
      await existEmail(value, { uid: null });
    }),

    validateFields, // middleware que devuelve errores de express-validator
  ],
  createUser
);

export default router;

/* import { testUser } from "./user.controller.js";
// RUTA DE PRUEBA: GET /api/v1/users/test
router.get("/test", testUser); */
