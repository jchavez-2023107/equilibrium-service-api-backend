import mongoose from "mongoose";

/**
 * Valida si un ID es un ObjectId válido de MongoDB
 * @param {string} id 
 */
export const isValidObjectId = (id = "") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("El ID no es válido.");
  }
  return true;
};