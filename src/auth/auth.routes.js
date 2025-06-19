import { Router } from "express";
import { registerUser, loginUser } from "./auth.controller.js";
import { validateJWT, validateRoles } from "../middlewares/validate.jwt.js";

const router = Router();

/**
 * 📌 Rutas de autenticación (montaremos bajo /api/v1/auth)
 */

// 🚫 POST /api/v1/auth/register → Registrar nuevo usuario (SOLO ADMIN)
router.post(
  "/register",
  [ validateJWT, validateRoles("ADMIN") ],
  registerUser
);

// POST  /api/v1/auth/login      → Iniciar sesión y recibir token
router.post("/login", loginUser);

// GET   /api/v1/auth/test       → Probar validación de JWT
router.get("/test", validateJWT, (req, res) => {
  res.json({ message: "Token válido. Usuario: " + req.user.username });
});

export default router;
