import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
} from "discord.js";
import { DISCORD_FLAGS } from "../constants/bot.js";
import { buildReminderSettingsPanel } from "../components/DailyCheckin/reminderSettingsPanel.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Reminder Settings")
    .setType(ApplicationCommandType.User),

  run: async ({ interaction, client }) => {
    const targetUser = interaction.targetUser;

    const panel = await buildReminderSettingsPanel(
      targetUser,
      client,
      interaction.user,
    );

    return interaction.reply({
      embeds: panel.embeds,
      components: panel.components,
      flags: DISCORD_FLAGS.EPHEMERAL,
    });
  },
};
