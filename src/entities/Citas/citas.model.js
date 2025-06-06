import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const AppointmentSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: "User"
        },
        volunteerId: {
            type: Types.ObjectId,
            ref: "User"
        },
        scheduledAt: {
            type: Date
        },
        reason: {
            type: String
        },
        status: {
            type: String,
            enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
            default: "PENDING"
        },
        notes: {
            type: String
        }
    },
    { timestamps: true }
);

export default model("ntment", AppointmentSchema);
