import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const MessageSchema = new Schema(
    {
        senderId: {
        type: Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        isEmergency: {
            type: Boolean,
            default: false
        },
        systemNote: {
            type: String,
            default: ""
        }
    },
    { _id: false }
    );

    const ChatSchema = new Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true
        },
        userId: {
            type: Types.ObjectId,
            ref: "User",
            required: true
        },
        volunteerId: {
            type: Types.ObjectId,
            ref: "User"
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        endedAt: {
            type: Date
        },
        status: {
            type: String,
            enum: ["ACTIVE", "ENDED", "PENDING"],
            default: "PENDING"
        },
        messages: [MessageSchema]
    },
    { timestamps: true }
);

export default model("Chat", ChatSchema);
