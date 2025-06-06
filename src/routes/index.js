import { Router } from "express";
import userRoutes from "../entities/User/user.routes.js";

const router = Router();

// Endpoint de health check
router.get("/health", (req, res) => {
  return res.json({ status: "ok", timestamp: new Date() });
});

// Montar rutas de usuario
router.use("/users", userRoutes);

export default router;
