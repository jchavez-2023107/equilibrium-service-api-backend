
export const validateRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: `No tienes permisos para realizar esta acción (rol requerido: ${allowedRoles.join(", ")})`,
      });
    }

    next();
  };
};
