import { Schema, model } from "mongoose";

const BirthdaySchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    userTag: { type: String, default: "" },
    guildId: { type: String, default: null },
    day: { type: Number, required: true, min: 1, max: 31 },
    month: { type: Number, required: true, min: 1, max: 12 },
    lastWishedYear: { type: Number, default: null },
  },
  { timestamps: true },
);

export default model("BirthdaySchema", BirthdaySchema);
