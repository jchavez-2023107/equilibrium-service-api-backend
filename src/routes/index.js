// src/routes/index.js
import { Router } from "express";
import authRoutes from "../auth/auth.routes.js";
import userRoutes from "../entities/User/user.routes.js"; // ruta de User
import chatRoutes from "../entities/Chat/chat.routes.js"
//import sessionHistory from "../entities/SessionHistory/sessionHistory.routes.js"
import notificationRoutes from "../entities/Notification/notification.routes.js";
import appointmentRoutes from "../entities/Citas/citas.routes.js";
//import resourceRoutes from "../entities/Resource/resource.routes.js"; // ruta de Resource

const router = Router();

// Health check
router.get("/health", (req, res) => {
  return res.json({ status: "ok", timestamp: new Date() });
});

// Montar auth
router.use("/auth", authRoutes);

// Montar rutas de usuarios (cuando se definan)
router.use("/users", userRoutes);
router.use("/chats", chatRoutes);
//router.use("/sessionsHistorys", sessionHistory);
router.use("/notifications", notificationRoutes);
router.use("/appointments", appointmentRoutes);

export default router;
