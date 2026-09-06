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

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

const __filename = fileURLToPath(import.meta.url);
const requiredEnvVars = ["TOKEN", "DB_URL"];

function validateEnv() {
  const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
  if (missingEnvVars.length === 0) return;

  throw new Error(`Missing required environment variable(s): ${missingEnvVars.join(", ")}`);
}

function getGuildIds() {
  if (!process.env.GUILD_ID) return [];
  try {
    const parsed = JSON.parse(process.env.GUILD_ID);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    return [process.env.GUILD_ID];
  }
}

function getRedactedMongoUrlInfo() {
  if (!process.env.DB_URL) return "DB_URL is not set";

  try {
    const dbUrl = new URL(process.env.DB_URL);
    const database = dbUrl.pathname.replace("/", "") || "(none)";
    const authSource = dbUrl.searchParams.get("authSource") || "(default)";

    return [
      `user=${decodeURIComponent(dbUrl.username || "(none)")}`,
      `host=${dbUrl.host}`,
      `database=${database}`,
      `authSource=${authSource}`,
    ].join(", ");
  } catch (error) {
    return "DB_URL is not a valid MongoDB URL.";
  }
}

function logStartupError(error) {
  const isMongoAuthError =
    error?.code === 8000 ||
    error?.codeName === "AtlasError" ||
    error?.message?.includes("Authentication failed");

  if (isMongoAuthError) {
    console.error(
      "❌ MongoDB authentication failed. Check DB_URL username/password, database user permissions, and authSource in the deploy environment.",
    );
    console.error(`MongoDB URL info: ${getRedactedMongoUrlInfo()}`);
    return;
  }

  console.error("❌ Bot startup failed:", error);
}

(async () => {
  try {
    validateEnv();
    const guildIds = getGuildIds();

    new CommandKit({
      client,
      devGuildIds: guildIds,
      devUserIds: [process.env.DEV_ID],
      eventsPath: `${path.dirname(__filename)}/events`,
      commandsPath: `${path.dirname(__filename)}/commands`,
      bulkRegister: true,
    });

    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.DB_URL, { keepAliveInitialDelay: 300000 });
    console.log("Connected to DB");
    await client.login(process.env.TOKEN);
  } catch (error) {
    logStartupError(error);
    process.exit(1);
  }
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

