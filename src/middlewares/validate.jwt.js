"use strict";

import jwt from "jsonwebtoken";
import { findUser } from "../utils/db.validators.js";

export const validateJWT = async (req, res, next) => {
  try {
    const secretKey = process.env.SECRET_KEY;
    const { authorization } = req.headers;

    if (!authorization) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Verifica el token; jwt.verify lanzará si no es válido
    const decoded = jwt.verify(authorization, secretKey);

    // decoded = { uid, username, role, email, iat } (sin exp porque no lo pusimos)
    const validateUser = await findUser(decoded.uid);
    if (!validateUser) {
      return res
        .status(401)
        .json({ message: "Unauthorized - User not found" });
    }

    // Cargamos en req.user la información básica
    req.user = {
      id: decoded.uid,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (err) {
    console.error("❌ JWT Error:", err);
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
};

export const validateRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(403).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Rol requerido: ${allowedRoles.join(" o ")}`
        });
      }

      next();
    } catch (e) {
      console.error(e);
      return res.status(500).json({
        success: false,
        message: "General Error ValidRol"
      });
    }
  };
};
