import { Schema, model } from 'mongoose';
import EventGameType from '../../enum/EventGameType.js';

let EventSchema = new Schema({
  title: { type: String, required: true },
  channelId: { type: String, required: true },
  scheduleType: { type: String, enum: ["linear", "interval"], required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  interval: { type: Number }, // days
  description: { type: String },
  event_start: { type: String },
  event_remind: { type: String },
  event_end: { type: String },

  // state tracking
  started: { type: Boolean, default: false },
  ended: { type: Boolean, default: false },
  reminded_3days: { type: Boolean, default: false },
  reminded_1day: { type: Boolean, default: false },
  reminded_1hour: { type: Boolean, default: false },
}, { timestamps: true });

EventSchema.pre("validate", function (next) {
    if (this.type === "linear" && (!this.startTime || !this.endTime)) {
        return next(new Error("startTime and endTime are required when type is linear"));
    }
    if (this.type === "interval" && (!this.startTime || !this.interval)) {
        return next(new Error("startTime and interval is required when type is interval"));
    }
    next();
});

export default model('EventSchema231202', EventSchema);