import { SlashCommandBuilder } from "discord.js";
import { DAILY_GAMES, DISCORD_FLAGS } from "../constants/bot.js";
import {
  ALL_GAME_CODES,
  buildReminderSettingsPanel,
} from "../components/DailyCheckin/reminderSettingsPanel.js";
import DailyCheckinSubscriptionSchema from "../db/DailyCheckin/dailyCheckinSubscriptionSchema.js";

const commandInfo = {
  name: "checkin-reminder",
  description: "Configure daily commission check-in reminders (games and reminder time)",
};

export default {
  data: new SlashCommandBuilder()
    .setName(commandInfo.name)
    .setDescription(commandInfo.description)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("settings")
        .setDescription("Open interactive reminder settings to choose games & ping time")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Member to configure reminders for (Defaults to yourself)")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("subscribe")
        .setDescription("Subscribe to daily check-in reminders (choose games and hour)")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Member to subscribe (Defaults to yourself)")
            .setRequired(false),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("hour")
            .setDescription("Hour of day to receive reminder (0-23 in UTC+7, default is 18)")
            .setMinValue(0)
            .setMaxValue(23)
            .setRequired(false),
        )
        .addStringOption((opt) =>
          opt
            .setName("games")
            .setDescription("Comma-separated game codes (e.g. gi, hsr) or leave blank for interactive menu")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unsubscribe")
        .setDescription("Stop daily check-in reminders")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Member to unsubscribe (Defaults to yourself)")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Check reminder status, ping time, and registered games")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Member to check status for (Defaults to yourself)")
            .setRequired(false),
        ),
    ),

  run: async ({ interaction, client }) => {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser("user") || interaction.user;
    const targetUserId = targetUser.id;

    if (subcommand === "settings") {
      const panel = await buildReminderSettingsPanel(targetUser, client, interaction.user);
      return interaction.reply({
        embeds: panel.embeds,
        components: panel.components,
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    if (subcommand === "subscribe") {
      const gamesInput = interaction.options.getString("games");
      const hourInput = interaction.options.getInteger("hour");

      // If no specific games provided in slash options, open the interactive panel
      if (!gamesInput) {
        const existing = await DailyCheckinSubscriptionSchema.findOne({ userId: targetUserId });
        const updateDoc = {
          userId: targetUserId,
          userTag: targetUser.tag,
          guildId: interaction.guildId,
          games: existing?.games?.length ? existing.games : ALL_GAME_CODES,
          reminderHour: hourInput ?? existing?.reminderHour ?? 18,
          subscribedBy: interaction.user.id,
          subscribedAt: new Date(),
        };

        await DailyCheckinSubscriptionSchema.findOneAndUpdate(
          { userId: targetUserId },
          updateDoc,
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        const panel = await buildReminderSettingsPanel(targetUser, client, interaction.user);
        return interaction.reply({
          content: `✅ Reminder configured for <@${targetUserId}>! You can customize games and time below:`,
          embeds: panel.embeds,
          components: panel.components,
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      // Parse comma-separated games
      const requestedCodes = gamesInput
        .split(/[,\s]+/)
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);

      const validCodes = ALL_GAME_CODES.filter((code) =>
        requestedCodes.includes(code) || requestedCodes.includes("all"),
      );

      const selectedCodes = validCodes.length > 0 ? validCodes : ALL_GAME_CODES;
      const existing = await DailyCheckinSubscriptionSchema.findOne({ userId: targetUserId });
      const targetHour = hourInput ?? existing?.reminderHour ?? 18;

      await DailyCheckinSubscriptionSchema.findOneAndUpdate(
        { userId: targetUserId },
        {
          userId: targetUserId,
          userTag: targetUser.tag,
          guildId: interaction.guildId,
          games: selectedCodes,
          reminderHour: targetHour,
          subscribedBy: interaction.user.id,
          subscribedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      const gameNames = DAILY_GAMES.filter((g) => selectedCodes.includes(g.code))
        .map((g) => g.label)
        .join(", ");

      const timeFormatted = `${String(targetHour).padStart(2, "0")}:00 UTC+7`;

      return interaction.reply({
        content: `✅ <@${targetUserId}> is subscribed for **${gameNames}**. Elysia will ping at **${timeFormatted}** in the daily channel if any of these are left incomplete.`,
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    if (subcommand === "unsubscribe") {
      const result = await DailyCheckinSubscriptionSchema.deleteOne({ userId: targetUserId });

      return interaction.reply({
        content:
          result.deletedCount > 0
            ? `✅ Unsubscribed <@${targetUserId}> from daily check-in reminders.`
            : `ℹ️ <@${targetUserId}> was not subscribed.`,
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    if (subcommand === "status") {
      const panel = await buildReminderSettingsPanel(targetUser, client, interaction.user);
      return interaction.reply({
        embeds: panel.embeds,
        components: panel.components,
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }
  },
};
