"use strict";

import mongoose from "mongoose";

let retryCount = 0;
const maxRetries = 3;

/*
 * Eventos de la conexión a MongoDB
 */
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB | Error en la conexión: ", err);
  retryCount++;

  if (retryCount >= maxRetries) {
    console.error(
      "❌ MongoDB | No se pudo conectar después de varios intentos. Cerrando aplicación..."
    );
    process.exit(1);
  } else {
    console.warn(`⚠️ MongoDB | Reintentando conexión... (${retryCount}/${maxRetries})`);
    setTimeout(connectDB, 5000);
  }
});

mongoose.connection.on("connecting", () => {
  console.log("🔄 MongoDB | Intentando conectar...");
});

mongoose.connection.on("connected", () => {
  console.log("🟢 MongoDB | Conectado con éxito");
});

mongoose.connection.once("open", () => {
  console.log("✅ MongoDB | Conexión establecida con la base de datos");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB | Re-conectado después de una desconexión");
});

mongoose.connection.on("disconnected", async () => {
  console.warn("⚠️ MongoDB | Desconectado, intentando reconectar...");
  if (retryCount < maxRetries) {
    setTimeout(async () => {
      if (mongoose.connection.readyState === 0) {
        await connectDB();
      }
    }, 5000);
  } else {
    console.error(
      "❌ MongoDB | Conexión perdida permanentemente. Cerrando aplicación..."
    );
    process.exit(1);
  }
});

/*
 * Función para conectar a MongoDB
 */
export const connectDB = async () => {
  try {
    const mongoURI = `${process.env.DB_SERVICE}://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
    console.log("🔄 Conectando a MongoDB...");

    await mongoose.connect(mongoURI, {
      maxPoolSize: 100,
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ Conexión exitosa a MongoDB");
    retryCount = 0;
  } catch (err) {
    console.error("❌ Error al conectar con MongoDB: ", err);

    retryCount++;
    if (retryCount >= maxRetries) {
      console.error(
        "❌ MongoDB | No se pudo conectar después de varios intentos. Cerrando aplicación..."
      );
      process.exit(1);
    } else {
      console.warn(
        `⚠️ MongoDB | Reintentando conexión en 5 segundos... (${retryCount}/${maxRetries})`
      );
      setTimeout(async () => {
        await connectDB();
      }, 5000);
    }
  }
};

/*
 * Función para cerrar la conexión (si en algún momento lo necesitas)
 */
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("🔴 Conexión a MongoDB cerrada correctamente");
  } catch (err) {
    console.error("⚠️ Error al cerrar la conexión a MongoDB: ", err);
  }
};
