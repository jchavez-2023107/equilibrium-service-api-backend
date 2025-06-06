'use strict'

import { hash, verify } from "argon2";

// Encriptar la password
export const encrypt = async (password) => {
  try {
    return await hash(password);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Validar contraseña
export const checkPassword = async (hash, password) => {
  try {
    return await verify(hash, password);
  } catch (err) {
    console.error(err);
    throw err;
  }
};
