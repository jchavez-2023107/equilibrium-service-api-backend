import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const RatingSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false } // El subdocumento no necesita su propio _id
);

const VolunteerDataSchema = new Schema(
  {
    available: {
      type: Boolean,
      default: false
    },
    schedules: [
      {
        day: { type: String },   // ej: "Lunes", "Martes", etc.
        from: { type: String },  // ej: "08:00"
        to: { type: String }     // ej: "17:00"
      }
    ],
    ratings: [RatingSchema]
  },
  { _id: false }
);

const ProfileSchema = new Schema(
  {
    displayName: {
      type: String,
      default: ""
    },
    birthDate: {
      type: Date
    },
    bio: {
      type: String
    },
    contactNumber: {
      type: String
    },
    especialidad: {
      type: String
    }
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    // Guardamos la contraseña como hash; select: false hace que no venga en las queries por defecto ya que no sería seguro.
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ["ADMIN", "VOLUNTEER", "USER"],
      default: "USER"
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE"
    },
    profile: ProfileSchema,
    volunteerData: VolunteerDataSchema
  },
  { timestamps: true }
);

// Exportación por defecto para que `import User from ".../user.model.js"` funcione bonito
export default model("User", UserSchema);
