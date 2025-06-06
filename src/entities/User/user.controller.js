import User from "./user.model.js";
import { encrypt } from "../../utils/encrypt.js";
import { existUsername, existEmail } from "../../utils/db.validators.js";

/**
 * createUser: crea un nuevo usuario (sin exponer el hash de la contraseña).
 */
export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role, profile } = req.body;

    // 1) Verificar que no exista otro documento con igual username o email
    //    Pasamos { uid: null } porque es creación, no actualización.
    await existUsername(username, { uid: null });
    await existEmail(email, { uid: null });

    // 2) Hashear la contraseña
    const hashedPassword = await encrypt(password);

    // 3) Armar el nuevo usuario
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "USER",      // si no viene, asigna “USER”
      profile: profile || {}     // puede venir vacío
      // volunteerData se inicializa por defecto (available=false, etc.)
    });

    // 4) Guardar en MongoDB
    await newUser.save();

    // 5) Eliminar _password_ antes de responder
    const userToReturn = newUser.toObject();
    delete userToReturn.password;

    return res.status(201).json({
      success: true,
      user: userToReturn
    });
  } catch (err) {
    next(err); // Dejamos que el error sea manejado por errorHandler en app.js
  }
};

/**
 * getUsers: devuelve todos los usuarios (sin contraseña).
 * Solo los usuarios con rol ADMIN pueden acceder.
 */
export const getUsers = async (req, res, next) => {
  try {
    // Obtenemos todos los usuarios excluyendo el campo "password"
    const users = await User.find().select("-password");
    return res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

/**
 * getUserById: devuelve un solo usuario por su :id (sin contraseña).
 * Permite al propio usuario ver su perfil o a un ADMIN ver cualquiera.
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requester = req.user; // { id, username, role, email }

    // Si no es ADMIN y no coincide con el id solicitado, denegar
    if (requester.role !== "ADMIN" && requester.id !== id) {
      return res
        .status(403)
        .json({ success: false, message: "Acceso denegado" });
    }

    // Buscar el usuario y excluir password
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * updateUser: (se implementará pronto)
 */

/**
 * deleteUser: (se implementará más adelante)
 */





/* // GET /users/test
export const testUser = async (req, res, next) => {
  try {
    // Intentamos buscar al primer usuario en la colección
    const user = await User.findOne();
    return res.json({ found: !!user, user });
  } catch (err) {
    next(err);
  }
}; */

