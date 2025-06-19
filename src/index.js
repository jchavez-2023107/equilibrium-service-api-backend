"use strict";
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./db/mongo.js";
import { createApp } from "./config/app.js"; // NO initServer
import { runSeed } from "./seed/seed.js";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

(async () => {
  try {
    await connectDB();

    if (process.env.NODE_ENV === "development") {
      await runSeed();
    }

    // 1. Instancia de express y servidor HTTP
    const app = createApp();
    const httpServer = createServer(app);

    // 2. Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "http://localhost:5173", // 👈 MATCH exacto con el frontend
    methods: ["GET", "POST"],
    credentials: true // 👈 necesario si usas withCredentials
  }
});

    // 3. Middleware JWT para socket.io (!!!)
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error("No token provided"));
        const secretKey = process.env.SECRET_KEY || process.env.JWT_SECRET; // Cuidado: debe ser IGUAL al usado al firmar el token
        const decoded = jwt.verify(token, secretKey);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error("Token inválido"));
      }
    });

    // 4. Conexión y unión a room del userId (clave para chat personal)
    io.on("connection", (socket) => {
      const userId = socket.user?.uid || socket.user?.id;
      if (userId) {
        socket.join(userId.toString());
        console.log(`[SOCKET] Usuario conectado a sala ${userId}`);
      }
    });

    // 5. Guardar io en app.locals para acceso en controladores
    app.locals.io = io;

    // 6. Levantar HTTP+socket en el puerto habitual
    const port = process.env.PORT || 2636;
    httpServer.listen(port, () => {
      console.log(`✅ Server + Socket.IO corriendo en puerto ${port}`);
    });
  } catch (err) {
    console.error("❌ Error crítico en la inicialización de la aplicación:", err);
    process.exit(1);
  }
})();
