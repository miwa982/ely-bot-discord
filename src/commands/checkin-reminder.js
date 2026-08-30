import { SlashCommandBuilder } from "discord.js";
import { DISCORD_FLAGS } from "../constants/bot.js";
import DailyCheckinSubscriptionSchema from "../db/DailyCheckin/dailyCheckinSubscriptionSchema.js";

const commandInfo = {
  name: "checkin-reminder",
  description: "Subscribe to the 18:00 daily check-in reminder",
};

export default {
  data: new SlashCommandBuilder()
    .setName(commandInfo.name)
    .setDescription(commandInfo.description)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("subscribe")
        .setDescription("Get pinged at 18:00 in the daily commission channel"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unsubscribe")
        .setDescription("Stop the 18:00 daily check-in reminder"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Check your daily check-in reminder subscription"),
    ),

  run: async ({ interaction }) => {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === "subscribe") {
      await DailyCheckinSubscriptionSchema.findOneAndUpdate(
        { userId },
        {
          userId,
          userTag: interaction.user.tag,
          guildId: interaction.guildId,
          subscribedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      return interaction.reply({
        content: "✅ You are subscribed. I will ping you at 18:00 in the daily commission channel.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    if (subcommand === "unsubscribe") {
      const result = await DailyCheckinSubscriptionSchema.deleteOne({ userId });

      return interaction.reply({
        content:
          result.deletedCount > 0
            ? "✅ You are unsubscribed from the 18:00 daily check-in reminder."
            : "ℹ️ You were not subscribed.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    const subscription = await DailyCheckinSubscriptionSchema.findOne({ userId });

    return interaction.reply({
      content: subscription
        ? "✅ You are subscribed to the 18:00 daily check-in reminder."
        : "ℹ️ You are not subscribed yet. Use `/checkin-reminder subscribe`.",
      flags: DISCORD_FLAGS.EPHEMERAL,
    });
  },
};
