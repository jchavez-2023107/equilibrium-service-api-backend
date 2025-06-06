// src/routes/index.js
import { Router } from "express";
import authRoutes from "../auth/auth.routes.js";
//import userRoutes from "../entities/User/user.routes.js";       // ruta de User
//import resourceRoutes from "../entities/Resource/resource.routes.js"; // ruta de Resource

const router = Router();

// Health check
router.get("/health", (req, res) => {
  return res.json({ status: "ok", timestamp: new Date() });
});

// Montar auth
router.use("/auth", authRoutes);

// Montar rutas de usuarios (cuando se definan)
// router.use("/users", userRoutes);

// Montar rutas de recursos (cuando se definan)
// router.use("/resources", resourceRoutes);

export default router;
