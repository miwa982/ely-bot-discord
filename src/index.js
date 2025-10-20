import { config } from 'dotenv'
import dotenvExpand from "dotenv-expand";
import path from 'path'
import { fileURLToPath } from 'url';
import {
  Client,
  GatewayIntentBits,
  AttachmentBuilder
} from 'discord.js';
import { CommandKit } from 'commandkit';
import mongoose from 'mongoose';
import ReminderSchema from './db/Reminder/reminderSchema.js';
import EventSchema from "./db/Event/eventSchema.js";
import { Elysia } from './utils/elysia.js';

const myEnv = config();
dotenvExpand.expand(myEnv);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessagePolls,
  ],
  rest: { timeout: 20000 },
});

const __filename = fileURLToPath(import.meta.url);

new CommandKit({
  client,
  devGuildIds: process.env.GUILD_ID ? JSON.parse(process.env.GUILD_ID) : [],
  devUserIds: [process.env.DEV_ID],
  eventsPath: `${path.dirname(__filename)}/events`,
  commandsPath: `${path.dirname(__filename)}/commands`,
  bulkRegister: true,
});

(async () => {
  mongoose.set('strictQuery', false);
  await mongoose.connect(process.env.DB_URL, { keepAliveInitialDelay: true });
  console.log("Connected to DB");
  client.login(process.env.TOKEN);
})();

setInterval(async () => {
  const now = new Date();
  const reminders = await ReminderSchema.find({ remindAt: { $lte: now }, isSent: false });

  for (const r of reminders) {
    try {
      const channel = await client.channels.fetch(r.channelId);
      await channel.send(`<@${r.userId}> \n⏰ Reminder: **${r.message}**`);
      r.isSent = true;
      await r.save();
    } catch (err) {
      console.error("Failed to send reminder:", err);
    }
  }
}, 30_000); // check every 30 seconds

setInterval(async () => {
  const now = new Date();

  const events = await EventSchema.find();

  for (const ev of events) {
    const channel = await client.channels.fetch(ev.channelId);
    if (!channel) continue;

    // ----------- Reminders -----------
    const reminders = [
      // { label: "3days", ms: 3 * 24 * 60 * 60 * 1000 },
      { label: "1day", ms: 1 * 24 * 60 * 60 * 1000 },
      { label: "1hour", ms: 1 * 60 * 60 * 1000 },
    ];

    const rLabel =
    {
      "3days": "3 days",
      "1day": "1 day",
      "1hour": "1 hour"
    }

    reminders.forEach(r => {
      if (
        ev.endDate - now > 0 &&
        ev.endDate - now <= r.ms &&
        !ev[`reminded_${r.label}`] // prevent duplicate send
      ) {
        const imageUrl = ev.event_remind ?? Elysia.DEFAULT_REMINDER_IMG;
        const attachment = new AttachmentBuilder(imageUrl);
        channel.send({
          files: [attachment],
          content: `@everyone \n⏰ Reminder: **${ev.title}** ends in less than ${rLabel[r.label]}! (<t:${Math.floor(ev.endDate.getTime() / 1000)}:F>)`

        }),
          ev[`reminded_${r.label}`] = true;
      }
    });

    //Event start
    if (!ev.started && Math.abs(ev.startDate - now) < 60 * 1000) {
      const imageUrl = ev.event_start ?? Elysia.DEFAULT_REMINDER_IMG;
      const attachment = new AttachmentBuilder(imageUrl);
      channel.send({
        files: [attachment],
        content: `@everyone **${ev.title}** has started!`
      }),
      ev.started = true;
    }

    //Event end
    if (ev.endDate && ev.started && !ev.ended && Math.abs(ev.endDate - now) < 60 * 1000) {
      const imageUrl = ev.event_end ?? Elysia.DEFAULT_REMINDER_IMG;
      const attachment = new AttachmentBuilder(imageUrl);
      channel.send({
        files: [attachment],
        content: `@everyone **${ev.title}** has ended!`
      }),
      ev.ended = true;

      // If interval type -> schedule next cycle
      if (ev.scheduleType === "interval") {
        ev.startDate = new Date(ev.startDate.getTime() + ev.interval * 24 * 60 * 60 * 1000);
        ev.endDate = new Date(ev.endDate.getTime() + ev.interval * 24 * 60 * 60 * 1000);

        // Reset flags
        ev.started = false;
        ev.ended = false;
        // ev.reminded_3days = false;
        ev.reminded_1day = false;
        ev.reminded_1hour = false;
      }
    }

    await ev.save();
  }
}, 60_000); // check every 1 min