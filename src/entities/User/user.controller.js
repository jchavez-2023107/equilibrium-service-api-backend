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

