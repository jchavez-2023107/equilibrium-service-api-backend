import User from "../entities/User/user.model.js";

/**
 * Verifica que no exista otro documento con el mismo username.
 * Si user.uid está presente (en update de usuario), ignora ese _id.
 */
export const existUsername = async (username, user) => {
  const alreadyUsername = await User.findOne({ username });
  if (alreadyUsername && alreadyUsername._id.toString() !== user.uid) {
    console.error(`Username ${username} is already taken`);
    throw new Error(`Username ${username} is already taken`);
  }
};

/**
 * Verifica que no exista otro documento con el mismo email.
 * Si user.uid está presente, ignora ese _id.
 */
export const existEmail = async (email, user) => {
  const alreadyEmail = await User.findOne({ email });
  if (alreadyEmail && alreadyEmail._id.toString() !== user.uid) {
    console.error(`Email ${email} is already taken`);
    throw new Error(`Email ${email} is already taken`);
  }
};

/**
 * Busca un usuario por su _id. Si no existe, retorna false.
 */
export const findUser = async (id) => {
  try {
    const userExist = await User.findById(id);
    if (!userExist) return false;
    return userExist;
  } catch (e) {
    console.error(e);
    return false;
  }
};
