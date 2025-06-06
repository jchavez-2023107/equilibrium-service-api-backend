"use strict";

import jwt from "jsonwebtoken";

/**
 * Generar un nuevo token JWT que NO expire nunca para evitar ataques, pero no afectar a los usuarios.
 * payload debe incluir al menos { uid, username, role, email }.
 */
export const generateToken = (payload) => {
  try {
    // No incluimos expiresIn: el token durará indefinidamente
    return jwt.sign(payload, process.env.SECRET_KEY, {
      algorithm: "HS256"
    });
  } catch (err) {
    console.error("❌ Error al generar JWT:", err);
    throw err;
  }
};
