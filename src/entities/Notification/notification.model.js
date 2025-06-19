import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const NotificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["EMERGENCY", "MESSAGE", "APPOINTMENT", "GENERAL"],
      required: true,
    },
    recipientRoles: [
      {
        type: String,
        enum: ["USER", "VOLUNTEER", "ADMIN"],
        required: true,
      },
    ],
    recipients: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    relatedChat: {
      type: Types.ObjectId,
      ref: "Chat",
      default: null,
    },
    relatedUser: {
      type: Types.ObjectId,
      ref: "User",
      required: true, // Usuario que creó o generó la notificación
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Notification", NotificationSchema);
