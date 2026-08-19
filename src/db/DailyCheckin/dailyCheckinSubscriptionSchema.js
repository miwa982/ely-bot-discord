import { Schema, model } from "mongoose";

const DailyCheckinSubscriptionSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    userTag: { type: String, required: true },
    guildId: { type: String, default: null },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default model(
  "DailyCheckinSubscriptionSchema231202",
  DailyCheckinSubscriptionSchema,
);
