"use strict";

import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

import { limiter } from "../middlewares/rate.limit.js";
import router from "../routes/index.js";

function configs(app) {
  app.use(morgan("dev"));
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(limiter);
}

function loadRoutes(app) {
  app.use("/api/v1", router);
}

function errorHandler(err, req, res, next) {
  console.error("❌ Error capturado:", err);

  if (Array.isArray(err?.errors)) {
    return res.status(400).json({ errors: err.errors });
  }
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Token inválido" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expirado" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "ID inválido en la base de datos" });
  }

  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

// 💡 Solo crea y configura la app, NO la arranca
export const createApp = () => {
  const app = express();
  const env = process.env.NODE_ENV || "development";
  console.log(`🛠️ Modo actual: ${env}`);

  configs(app);
  loadRoutes(app);

  // 404 para cualquier ruta no encontrada
  app.use((req, res) => {
    res.status(404).json({ message: "Ruta no encontrada" });
  });

  // Handler de errores
  app.use(errorHandler);

  return app; // <--- Importante: retorna la instancia
};
