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
 * updateUser: actualiza un usuario.
 * - ADMIN puede cambiar cualquier campo (username, email, role, status, profile).
 * - El propio usuario (USER) solo puede cambiar su perfil.
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requester = req.user; // { id, username, role, email }
    const body = req.body;

    let updates = {};

    if (requester.role === "ADMIN") {
      // ADMIN: puede actualizar username, email, role, status, profile y volunteerData
      const { username, email, role, status, profile, volunteerData } = body;

      if (username) {
        await existUsername(username, { uid: id });
        updates.username = username;
      }
      if (email) {
        await existEmail(email, { uid: id });
        updates.email = email;
      }
      if (role) updates.role = role;
      if (status) updates.status = status;
      if (profile) updates.profile = profile;
      if (volunteerData) updates.volunteerData = volunteerData;

    } else if (requester.id === id) {
      // PROPIO USUARIO (USER o VOLUNTEER): puede actualizar profile y volunteerData
      let didUpdate = false;

      if (body.profile) {
        updates.profile = body.profile;
        didUpdate = true;
      }

      if (body.volunteerData) {
        updates.volunteerData = body.volunteerData;
        didUpdate = true;
      }

      if (!didUpdate) {
        return res
          .status(403)
          .json({ success: false, message: "Nada que modificar en tu perfil." });
      }

    } else {
      return res
        .status(403)
        .json({ success: false, message: "Acceso denegado" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    next(err);
  }
};

/**
 * deleteUser: soft delete (status="INACTIVE").
 * - ADMIN puede inactivar cualquiera; USER solo su propia cuenta.
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    // 1) Sólo ADMIN o el mismo usuario pueden inactivar
    if (requester.role !== "ADMIN" && requester.id !== id) {
      return res.status(403).json({ success: false, message: "Acceso denegado" });
    }

    // 2) Actualizar status a INACTIVE
    const disabled = await User.findByIdAndUpdate(
      id,
      { status: "INACTIVE" },
      { new: true }
    ).select("-password");

    if (!disabled) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, user: disabled });
  } catch (err) {
    next(err);
  }
};

/**
 * registerVolunteer: crea un voluntario con status PENDING.
 * Campos en req.body:
 *  - username, email, password, profile (subdocumento),
 *  - volunteerData (available, schedules, needs).
 */
export const registerVolunteer = async (req, res, next) => {
  try {
    const { username, email, password, profile, volunteerData } = req.body;

    // 1) Verificar unicidad
    await existUsername(username, { uid: null });
    await existEmail(email, { uid: null });

    // 2) Hash de la contraseña
    const hashed = await encrypt(password);

    // 3) Nuevo usuario con rol VOLUNTEER y status PENDING
    const vol = new User({
      username,
      email,
      password: hashed,
      role: "VOLUNTEER",
      status: "PENDING",
      profile: profile || {},
      volunteerData: volunteerData || {}
    });

    await vol.save();

    const out = vol.toObject();
    delete out.password;

    res.status(201).json({ success: true, volunteer: out });
  } catch (err) {
    next(err);
  }
};

/**
 * approveVolunteer: cambia status de PENDING → ACTIVE.
 * Sólo ADMIN puede hacerlo.
 */
export const approveVolunteer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await User.findByIdAndUpdate(
      id,
      { status: "ACTIVE" },
      { new: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    res.json({ success: true, volunteer: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * listVolunteers: obtiene todos los VOLUNTEER con status ACTIVE.
 * Permite filtrar por query ?need=EMERGENCY|APPOINTMENT|CHAT
 */
export const listVolunteers = async (req, res, next) => {
  try {
    const { need } = req.query;
    const filter = { role: "VOLUNTEER", status: "ACTIVE" };
    if (need) filter["volunteerData.needs"] = need;

    const vols = await User.find(filter).select("-password");
    res.json({ success: true, volunteers: vols });
  } catch (err) {
    next(err);
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

