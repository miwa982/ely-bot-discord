import { Schema, model } from 'mongoose';

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    channelId: { type: String, required: true },
    guildId: { type: String, default: null },
    thumbnailUrl: { type: String, default: "" },

    // Raw schedule string input by user (e.g. "Mon 15:00 - Wed 22:00")
    rawSchedule: { type: String, default: "" },

    // Parsed schedule kind & pattern
    scheduleType: { type: String, default: "custom" }, // "weekly", "interval", "linear", "custom"
    weeklyPattern: {
      startDay: Number,
      startHour: Number,
      startMinute: Number,
      endDay: Number,
      endHour: Number,
      endMinute: Number,
    },
    interval: { type: Number, default: 0 },

    // Active cycle timeframe
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },

    // Dynamic reminder configuration
    rawReminders: { type: String, default: "1d, 2h, 1h, 30m" },
    reminderThresholds: [
      {
        label: { type: String },
        ms: { type: Number },
      },
    ],

    // Image triggers
    event_start: { type: String, default: null },
    event_remind: { type: String, default: null },
    event_end: { type: String, default: null },

    // State tracking for current cycle
    started: { type: Boolean, default: false },
    ended: { type: Boolean, default: false },
    sentReminderLabels: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default model('EventSchema231202', EventSchema);