import { Schema, model } from "mongoose";

const ReminderSchema = new Schema({
    userId: { type: String, required: true },
    channelId: { type: String, required: true },
    message: { type: String, required: true },
    remindAt: { type: Date, required: true },
    isSent: { type: Boolean, default: false }
}, { timestamps: true });

export default model("ReminderSchema231202", ReminderSchema);
