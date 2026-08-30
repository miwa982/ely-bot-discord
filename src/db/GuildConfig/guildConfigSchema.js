import { Schema, model } from "mongoose";

const GuildConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true },
    dailyChannelId: { type: String, default: null },
    birthdayChannelId: { type: String, default: null },
    eventChannelId: { type: String, default: null },
    checklistChannelId: { type: String, default: null },
  },
  { timestamps: true },
);

export default model("GuildConfigSchema", GuildConfigSchema);
