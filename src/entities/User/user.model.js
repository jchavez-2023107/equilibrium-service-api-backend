import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

// Subdocumento para calificaciones dadas a voluntarios
const RatingSchema = new Schema(
  {
    userId:    { type: Types.ObjectId, ref: "User", required: true },
    rating:    { type: Number, min: 1, max: 5 },
    comment:   { type: String },
    date:      { type: Date, default: Date.now }
  },
  { _id: false, versionKey: false }
);

// Esquema para datos específicos de voluntarios
const VolunteerDataSchema = new Schema(
  {
    available: { type: Boolean, default: false },
    schedules: [
      {
        day:  { type: String },
        from: { type: String },
        to:   { type: String }
      }
    ],
    needs: {
      type:    [String],
      enum:    ["EMERGENCY","APPOINTMENT","CHAT"],
      default: []
    },
    ratings: [RatingSchema]
  },
  { _id: false, versionKey: false }
);

// Esquema para información de perfil de usuario
const ProfileSchema = new Schema(
  {
    displayName:   { type: String, default: "" },
    birthDate:     { type: Date },
    bio:           { type: String },
    contactNumber: { type: String },
    especialidad:  { type: String }
  },
  { _id: false, versionKey: false }
);

// Esquema principal de Usuario
const UserSchema = new Schema(
  {
    username: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true
    },
    email: {
      type:     String,
      required: true,
      unique:   true,
      lowercase:true,
      trim:     true
    },
    password: {
      type:     String,
      required: true,
      select:   false
    },
    role: {
      type:    String,
      enum:    ["ADMIN","VOLUNTEER","USER"],
      default: "USER"
    },
    status: {
      type:    String,
      enum:    ["PENDING","ACTIVE","INACTIVE"],
      default: "ACTIVE"
    },
    profile:       ProfileSchema,
    volunteerData: VolunteerDataSchema
  },
  {
    timestamps:  true,
    versionKey:  false
  }
);

// Exportar el modelo para uso en controladores y rutas
export default model("User", UserSchema);
