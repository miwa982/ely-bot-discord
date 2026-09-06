import { Schema, model } from "mongoose";

const DailyCheckinSubscriptionSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    userTag: { type: String, required: true },
    guildId: { type: String, default: null },
    games: {
      type: [String],
      default: ["gi", "hsr", "hi3", "zzz", "ww", "miliastra"],
    },
    reminderHour: {
      type: Number,
      default: 18,
      min: 0,
      max: 23,
    },
    subscribedBy: { type: String, default: null },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default model(
  "DailyCheckinSubscriptionSchema231202",
  DailyCheckinSubscriptionSchema,
);
