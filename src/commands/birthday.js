import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { BOT_CONFIG, DISCORD_FLAGS } from "../constants/bot.js";
import BirthdaySchema from "../db/Birthday/birthdaySchema.js";

const MONTH_CHOICES = [
  { name: "01 - January", value: 1 },
  { name: "02 - February", value: 2 },
  { name: "03 - March", value: 3 },
  { name: "04 - April", value: 4 },
  { name: "05 - May", value: 5 },
  { name: "06 - June", value: 6 },
  { name: "07 - July", value: 7 },
  { name: "08 - August", value: 8 },
  { name: "09 - September", value: 9 },
  { name: "10 - October", value: 10 },
  { name: "11 - November", value: 11 },
  { name: "12 - December", value: 12 },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MAX_DAYS_PER_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isValidDate(day, month) {
  if (month < 1 || month > 12) return false;
  const maxDays = MAX_DAYS_PER_MONTH[month - 1];
  return day >= 1 && day <= maxDays;
}

function formatBirthday(day, month) {
  const dayStr = String(day).padStart(2, "0");
  const monthName = MONTH_NAMES[month - 1];
  return `${dayStr} ${monthName}`;
}

function getDaysUntilNextBirthday(day, month, now = new Date()) {
  const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const currentYear = utc7.getUTCFullYear();
  const currentMonth = utc7.getUTCMonth() + 1;
  const currentDay = utc7.getUTCDate();

  let targetYear = currentYear;
  if (month < currentMonth || (month === currentMonth && day < currentDay)) {
    targetYear += 1;
  }

  const todayMidnight = Date.UTC(currentYear, currentMonth - 1, currentDay);
  const nextBirthdayMidnight = Date.UTC(targetYear, month - 1, day);
  const diffDays = Math.round((nextBirthdayMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default {
  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Birthday system commands")
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Set a birthday")
        .addIntegerOption((opt) =>
          opt
            .setName("month")
            .setDescription("Birth month")
            .setRequired(true)
            .addChoices(...MONTH_CHOICES),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("day")
            .setDescription("Birth day (1-31)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(31),
        )
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Target user (Defaults to yourself)")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("View a member's birthday")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("User to check (Defaults to yourself)")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("List all registered birthdays in this server"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a member's birthday")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("User to remove (Defaults to yourself)")
            .setRequired(false),
        ),
    ),

  run: async ({ interaction }) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "set") {
      const month = interaction.options.getInteger("month");
      const day = interaction.options.getInteger("day");
      const targetUser = interaction.options.getUser("user") || interaction.user;

      const isSelf = targetUser.id === interaction.user.id;
      const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

      if (!isSelf && !isAdmin) {
        return interaction.reply({
          content: "❌ You can only set your own birthday unless you have Manage Server permissions.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      if (!isValidDate(day, month)) {
        return interaction.reply({
          content: `❌ Invalid date: **${day} ${MONTH_NAMES[month - 1]}** does not exist.`,
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      await BirthdaySchema.findOneAndUpdate(
        { userId: targetUser.id },
        {
          userId: targetUser.id,
          userTag: targetUser.tag || targetUser.username,
          guildId: interaction.guildId,
          day,
          month,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      const daysUntil = getDaysUntilNextBirthday(day, month);
      const countdownText = daysUntil === 0 ? "🎉 That is today!" : `in **${daysUntil}** day(s)`;

      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Elysia",
          iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
        })
        .setTitle("🎂 Birthday Saved!")
        .setColor(BOT_CONFIG.EMBED_COLOR)
        .setDescription(
          `Registered birthday for <@${targetUser.id}> as **${formatBirthday(day, month)}** (${countdownText}).`,
        )
        .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    if (subcommand === "view") {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const birthday = await BirthdaySchema.findOne({ userId: targetUser.id });

      if (!birthday) {
        return interaction.reply({
          content: targetUser.id === interaction.user.id
            ? "ℹ️ You haven't set your birthday yet! Use `/birthday set` to register it."
            : `ℹ️ <@${targetUser.id}> hasn't set their birthday yet.`,
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      const daysUntil = getDaysUntilNextBirthday(birthday.day, birthday.month);
      const countdownText = daysUntil === 0 ? "🎉 Today is their birthday!" : `🎂 Next birthday in **${daysUntil}** day(s).`;

      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Elysia",
          iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
        })
        .setTitle(`🎂 ${targetUser.username}'s Birthday`)
        .setColor(BOT_CONFIG.EMBED_COLOR)
        .setDescription(
          `**Date:** ${formatBirthday(birthday.day, birthday.month)}\n${countdownText}`,
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    if (subcommand === "remove") {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const isSelf = targetUser.id === interaction.user.id;
      const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

      if (!isSelf && !isAdmin) {
        return interaction.reply({
          content: "❌ You can only remove your own birthday unless you have Manage Server permissions.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      const result = await BirthdaySchema.deleteOne({ userId: targetUser.id });

      return interaction.reply({
        content:
          result.deletedCount > 0
            ? `✅ Removed birthday record for <@${targetUser.id}>.`
            : `ℹ️ No birthday record found for <@${targetUser.id}>.`,
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    if (subcommand === "list") {
      const birthdays = await BirthdaySchema.find();
      if (!birthdays.length) {
        return interaction.reply({
          content: "ℹ️ No birthdays registered in the database yet.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      // Sort by upcoming days
      const now = new Date();
      const sorted = birthdays
        .map((b) => ({
          ...b.toObject(),
          daysUntil: getDaysUntilNextBirthday(b.day, b.month, now),
        }))
        .sort((a, b) => a.daysUntil - b.daysUntil);

      const birthdayLines = sorted.map((b) => {
        const dateStr = formatBirthday(b.day, b.month);
        const dayDiff = b.daysUntil === 0 ? "🎉 **TODAY!**" : `in ${b.daysUntil}d`;
        return `• <@${b.userId}> — **${dateStr}** (${dayDiff})`;
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Elysia",
          iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
        })
        .setTitle("🎉 Upcoming Birthdays")
        .setColor(BOT_CONFIG.EMBED_COLOR)
        .setDescription(birthdayLines.slice(0, 20).join("\n") || "No birthdays found.")
        .setFooter({
          text: sorted.length > 20 ? `Showing top 20 of ${sorted.length} birthdays` : "Elysia Birthday Tracker",
        })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
      });
    }
  },
};
