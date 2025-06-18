import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const NotificationSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: [
        "NEW_MESSAGE",
        "EMERGENCY_MESSAGE",
        "APPOINTMENT_CREATED",
        "APPOINTMENT_UPDATED",
        "APPOINTMENT_CANCELLED",
        "SESSION_ENDED",
        "EMERGENCY_ALERT",     // ✅ NUEVO: alerta de emergencia general
        "EMERGENCY_TAKEN"      // ✅ NUEVO: confirmación al voluntario que aceptó
      ],
      required: true
    },
    title: { 
        type: String, 
        required: true 
    },
    body:  { 
        type: String, 
        required: true 
    },
    read:  { 
        type: Boolean, 
        default: false 
    },
    data:  { 
        type: Object, 
        default: {} 
    }
  },
  { timestamps: true }
);

export default model("Notification", NotificationSchema);
