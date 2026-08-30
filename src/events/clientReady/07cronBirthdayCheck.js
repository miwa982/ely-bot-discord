import { CronJob } from "cron";
import { EmbedBuilder } from "discord.js";
import { BOT_CONFIG } from "../../constants/bot.js";
import BirthdaySchema from "../../db/Birthday/birthdaySchema.js";
import { Elysia } from "../../utils/elysia.js";

const ELYSIA_BOT_ID = "ELYSIA_BOT";
const ELYSIA_BIRTHDAY_MONTH = 11;
const ELYSIA_BIRTHDAY_DAY = 11;

export async function checkAndSendBirthdays(client) {
  try {
    const channelId = process.env[BOT_CONFIG.DAILY_CHANNEL_ENV];
    if (!channelId) {
      console.warn("DAILY_CHANNEL_ID not set, skipping birthday check.");
      return;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      console.warn(`Birthday announcement channel (${channelId}) not found or not text-based.`);
      return;
    }

    const now = new Date();
    const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentYear = utc7.getUTCFullYear();
    const currentMonth = utc7.getUTCMonth() + 1;
    const currentDay = utc7.getUTCDate();

    // 1. Check Elysia's own birthday (Nov 11)
    if (currentMonth === ELYSIA_BIRTHDAY_MONTH && currentDay === ELYSIA_BIRTHDAY_DAY) {
      const elysiaRecord = await BirthdaySchema.findOne({ userId: ELYSIA_BOT_ID });
      if (!elysiaRecord || elysiaRecord.lastWishedYear !== currentYear) {
        const botEmbed = new EmbedBuilder()
          .setAuthor({
            name: "Elysia 🌸",
            iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
          })
          .setTitle("🎂 Happy Birthday to Elysia! 🎉")
          .setColor(BOT_CONFIG.EMBED_COLOR)
          .setDescription(`> *"${Elysia.birthday_response()}"*`)
          .setImage("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
          .setTimestamp();

        await channel.send({
          content: `@everyone 🎂 Today is Elysia's Birthday!`,
          embeds: [botEmbed],
        });

        await BirthdaySchema.findOneAndUpdate(
          { userId: ELYSIA_BOT_ID },
          {
            userId: ELYSIA_BOT_ID,
            day: ELYSIA_BIRTHDAY_DAY,
            month: ELYSIA_BIRTHDAY_MONTH,
            lastWishedYear: currentYear,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      }
    }

    // 2. Check Member Birthdays
    const todayBirthdays = await BirthdaySchema.find({
      userId: { $ne: ELYSIA_BOT_ID },
      month: currentMonth,
      day: currentDay,
      $or: [
        { lastWishedYear: { $ne: currentYear } },
        { lastWishedYear: { $exists: false } },
        { lastWishedYear: null },
      ],
    });

    for (const b of todayBirthdays) {
      try {
        const birthdayEmbed = new EmbedBuilder()
          .setAuthor({
            name: "Elysia",
            iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
          })
          .setTitle("🎂 Happy Birthday! 🎉")
          .setColor(BOT_CONFIG.EMBED_COLOR)
          .setDescription(
            `> *"${Elysia.member_birthday_response()}"*\n\nWishing you a wonderful year ahead filled with happiness and joy! 🌸✨`,
          )
          .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
          .setTimestamp();

        await channel.send({
          content: `<@${b.userId}> ${Elysia.member_birthday_response()}`,
          embeds: [birthdayEmbed],
          allowedMentions: { users: [b.userId] },
        });

        b.lastWishedYear = currentYear;
        await b.save();
      } catch (err) {
        console.error(`Failed to send birthday celebration for user ${b.userId}:`, err);
      }
    }
  } catch (error) {
    console.error("Error during birthday check:", error);
  }
}

export default (client) => {
  // Check immediately on startup
  checkAndSendBirthdays(client);

  // Schedule daily check at 00:00 UTC+7 (Asia/Bangkok)
  new CronJob(
    "0 0 * * *",
    async () => {
      await checkAndSendBirthdays(client);
    },
    null,
    true,
    BOT_CONFIG.DEFAULT_TIMEZONE,
  );
};
