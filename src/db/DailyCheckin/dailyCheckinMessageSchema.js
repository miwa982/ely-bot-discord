import { Schema, model } from "mongoose";

const dailyCheckinMessageSchema = new Schema(
  {
    dateKey: { type: String, required: true },
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    guildId: { type: String, default: null },
  },
  { timestamps: true },
);

dailyCheckinMessageSchema.index({ dateKey: 1, channelId: 1 }, { unique: true });

export default model("DailyCheckinMessage", dailyCheckinMessageSchema);
