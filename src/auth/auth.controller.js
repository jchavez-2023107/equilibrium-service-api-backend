import User from "../entities/User/user.model.js";    // Ruta hacia el modelo
import { encrypt, checkPassword } from "../utils/encrypt.js";
import { generateToken } from "../utils/jwt.js";

/**
 * Registrar un nuevo usuario.
 * - Campos esperados en req.body: { username, email, password, profile?, role? }
 *   (En “EQUILIBRIUM” el rol por defecto será "USER".)
 */
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, profile, role } = req.body;
    const ROLES = ["ADMIN", "VOLUNTEER", "USER"];

    // 1) Verificar que no exista ya el mismo username o email
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or Email already taken" });
    }

    // 2) Validar el rol (si vino en req.body), o asignar “USER” por defecto
    let finalRole = "USER";
    if (role) {
      if (!ROLES.includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
          validRoles: ROLES
        });
      }
      finalRole = role;
    }

    // 3) Hashear la contraseña
    const hashedPassword = await encrypt(password);

    // 4) Crear el nuevo usuario
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: finalRole,
      profile: profile || {}
      // Nota: si quieres asignar profile.displayName, birthDate, etc.,
      // puedes pasarlo en req.body.profile.
    });

    await newUser.save();

    // 5) Eliminar la contraseña antes de enviar la respuesta
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse
    });
  } catch (error) {
    console.error("❌ Error in registerUser:", error);
    res.status(500).json({
      message: "Error registering user",
      error: error.message
    });
  }
};

/**
 * Iniciar sesión con username o email.
 * - Espera en req.body: { userlogin, password }
 * - Si es correcto, devuelve { token }.
 * - El token NO expirará (dura indefinidamente).
 */
export const loginUser = async (req, res) => {
  try {
    const { userlogin, password } = req.body;

    // 1) Buscar el usuario por username o email, incluyendo la contraseña
    const user = await User.findOne({
      $or: [{ username: userlogin }, { email: userlogin }]
    }).select("+password"); // Forzamos traer el campo password
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2) Comparar la contraseña
    const isValid = await checkPassword(user.password, password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3) Generar el token (payload con los datos mínimos que necesitamos)
    const token = generateToken({
      uid: user._id,
      username: user.username,
      role: user.role,
      email: user.email
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error("❌ Error in loginUser:", error);
    res.status(500).json({
      message: "Error logging in",
      error: error.message
    });
  }
};
