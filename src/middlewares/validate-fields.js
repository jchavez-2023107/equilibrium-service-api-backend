import { validationResult } from "express-validator";

/**
 * validateFields: comprueba resultados de express-validator
 * Si hay errores, responde con status 400 y lista de errores.
 */
export const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
