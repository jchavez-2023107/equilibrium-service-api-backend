"use strict";

import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./db/mongo.js";
import { createApp } from "./config/app.js";   // Cambia: usaremos createApp (no initServer)
import { runSeed } from "./seed/seed.js";

import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

// --- INICIO DEL SERVIDOR Y SOCKET.IO ---
(async () => {
  try {
    await connectDB();
    if (process.env.NODE_ENV === "development") {
      await runSeed();
    }

    // 1. Creamos instancia de Express y httpServer
    const app = createApp();
    const httpServer = createServer(app);

    // 2. Configuramos Socket.IO
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",   // Cambia si tienes un frontend con dominio específico
        methods: ["GET", "POST"]
      }
    });

    // 3. Middleware de autenticación con JWT para sockets
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error("No token provided"));
        const secretKey = process.env.SECRET_KEY;
        const decoded = jwt.verify(token, secretKey);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error("Token inválido"));
      }
    });

    // 4. Escuchamos conexiones y unimos a sala personalizada (userId)
    io.on("connection", (socket) => {
      const userId = socket.user?.uid || socket.user?.id;
      if (userId) {
        socket.join(userId.toString());
        // Puedes añadir logs/debug
        // console.log(`Usuario conectado al socket: ${userId}`);
      }
      // Aquí puedes manejar otros eventos si deseas...
    });

    // 5. Guardamos io en app.locals para que esté accesible en todos los controladores
    app.locals.io = io;

    // 6. Levantamos el servidor en el puerto habitual
    const port = process.env.PORT || 2636;
    httpServer.listen(port, () => {
      console.log(`✅ Server + Socket.IO corriendo en puerto ${port}`);
    });

  } catch (err) {
    console.error("❌ Error crítico en la inicialización de la aplicación:", err);
    process.exit(1);
  }
})();
