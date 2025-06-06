// src/entities/User/user.routes.js
import { Router } from "express";
import { check } from "express-validator";

import { 
    createUser, 
    getUsers, 
    getUserById 

} from "./user.controller.js";
import { existUsername, existEmail } from "../../utils/db.validators.js";
import { validateFields } from "../../middlewares/validate-fields.js";
import { validateJWT, validateRoles } from "../../middlewares/validate.jwt.js";


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

/**
 * GET /api/v1/users
 * Obtener lista de usuarios (solo ADMIN)
 */
router.get(
  "/",
  [
    validateJWT,                    // Verificar que el token sea válido
    validateRoles("ADMIN")         // Solo ADMIN puede obtener todos los usuarios
  ],
  getUsers
);

/**
 * GET /api/v1/users/:id
 * Obtener detalle de un usuario por su ID (ADMIN o el propio usuario)
 */
router.get(
  "/:id",
  [
    validateJWT,                    // Verificar que el token sea válido
    check("id", "Invalid User ID").isMongoId(),
    validateFields
  ],
  getUserById
);

export default router;

/* import { testUser } from "./user.controller.js";
// RUTA DE PRUEBA: GET /api/v1/users/test
router.get("/test", testUser); */
