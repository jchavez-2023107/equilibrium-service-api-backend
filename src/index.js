"use strict";

import dotenv from "dotenv";
dotenv.config(); // Cargar variables de entorno desde .env

import { connectDB } from "./db/mongo.js";         // Conexión a MongoDB
import { initServer } from "./config/app.js";      // Inicialización de Express
import { runSeed } from "./seed/seed.js";          // Función que inserta datos por defecto

/*
 * Secuencia para iniciar la aplicación:
 * 1) Conectar a MongoDB
 * 2) Ejecutar seed para poblar datos por defecto
 * 3) Si todo va bien, arrancar Express (initServer)
 */
(async () => {
  try {
    await connectDB();

    //  -- CARGAR DATOS POR DEFECTO --
    // Ejecutar seed sólo en entorno de desarrollo (mientras lo desarrollamos):
    if (process.env.NODE_ENV === "development") {
      await runSeed();
    }

    initServer();
  } catch (err) {
    console.error("❌ Error crítico en la inicialización de la aplicación:", err);
    process.exit(1);
  }
})();
