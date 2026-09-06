import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { BOT_CONFIG, DISCORD_FLAGS } from "../constants/bot.js";
import {
  buildCompletionMap,
  buildUserPickerComponents,
  getDailyGameOptions,
  getTodayDailyMessage,
} from "./daily.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Daily Check-in")
    .setType(ApplicationCommandType.User),

  run: async ({ interaction, client }) => {
    const targetUser = interaction.targetUser;

    const message = await getTodayDailyMessage(client, interaction.channelId, interaction.guildId);
    if (!message) {
      return interaction.reply({
        content: "❌ No active daily check-in message found for today. Use `/daily send` first.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    const currentEmbed = message.embeds[0];
    const games = await getDailyGameOptions(client);
    const completionMap = buildCompletionMap(games, currentEmbed);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Elysia Check-in Manager",
        iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
      })
      .setTitle(`Daily Check-in for ${targetUser.username}`)
      .setDescription(
        `Click a button below to toggle check-in for <@${targetUser.id}> on today's daily checklist.`,
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      components: buildUserPickerComponents(games, completionMap, targetUser.id),
      flags: DISCORD_FLAGS.EPHEMERAL,
    });
  },
};
