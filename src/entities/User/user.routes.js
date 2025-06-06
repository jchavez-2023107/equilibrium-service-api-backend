import { Router } from "express";
import { testUser } from "./user.controller.js";

const router = Router();

// RUTA DE PRUEBA: GET /api/v1/users/test
router.get("/test", testUser);

export default router;
