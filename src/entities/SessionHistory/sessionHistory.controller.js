import SessionHistory from "./sessionHistory.model.js";
import User from "../User/user.model.js";

/**
 * createOrAppendSession: Crea un historial o agrega sesión a historial existente.
 */
export const createOrAppendSession = async (req, res, next) => {
  try {
    const {
      userId,
      volunteerId,
      sessionId,
      startedAt,
      endedAt,
      durationMinutes,
      rating
    } = req.body;

    const [user, volunteer] = await Promise.all([
      User.findById(userId),
      User.findById(volunteerId)
    ]);

    if (!user || !volunteer) {
      return res.status(404).json({ success: false, message: "Usuario(s) no encontrado(s)" });
    }

    const newSession = {
      volunteerId,
      sessionId,
      startedAt,
      endedAt,
      durationMinutes,
      rating
    };

    const sessionHistory = await SessionHistory.findOneAndUpdate(
      { userId },
      { $push: { sessions: newSession } },
      { upsert: true, new: true }
    ).populate("userId", "_id username")
     .populate("sessions.volunteerId", "_id username");

    res.status(200).json({ success: true, sessionHistory });
  } catch (err) {
    next(err);
  }
};

/**
 * getSessionHistoryByUser: Obtiene el historial de sesiones de un usuario.
 */
export const getSessionHistoryByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const history = await SessionHistory.findOne({ userId })
      .populate("userId", "_id username")
      .populate("sessions.volunteerId", "_id username");

    if (!history) {
      return res.status(404).json({ success: false, message: "Historial no encontrado" });
    }

    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
};

/**
 * getAllSessionHistories: Devuelve todos los historiales (uso típico para admin).
 */
export const getAllSessionHistories = async (req, res, next) => {
  try {
    const histories = await SessionHistory.find()
      .populate("userId", "_id username")
      .populate("sessions.volunteerId", "_id username");

    res.json({ success: true, histories });
  } catch (err) {
    next(err);
  }
};

/**
 * deleteSessionHistory: Elimina el historial de un usuario.
 */
export const deleteSessionHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const deleted = await SessionHistory.findOneAndDelete({ userId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Historial no encontrado" });
    }

    res.json({ success: true, message: "Historial eliminado" });
  } catch (err) {
    next(err);
  }
};
