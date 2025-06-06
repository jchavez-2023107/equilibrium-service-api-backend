import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const SessionSchema = new Schema(
    {
        volunteerId: {
            type: Types.ObjectId,
            ref: "User"
        },
        sessionId: {
            type: String
        },
        startedAt: {
            type: Date
        },
        endedAt: {
            type: Date
        },
        durationMinutes: {
            type: Number
        },
        rating: {
            type: Number
        }
    },
    { _id: false }
);

const SessionHistorySchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: "User"
        },
        sessions: [SessionSchema]
    },
    { timestamps: true }
);

export default model("SessionHistory", SessionHistorySchema);
