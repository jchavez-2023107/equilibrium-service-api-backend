import User from "./user.model.js";

// GET /users/test
export const testUser = async (req, res, next) => {
  try {
    // Intentamos buscar al primer usuario en la colección
    const user = await User.findOne();
    return res.json({ found: !!user, user });
  } catch (err) {
    next(err);
  }
};
