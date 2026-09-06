import { handleReminderSettingsInteraction } from "../../components/DailyCheckin/reminderSettingsPanel.js";

export default async (interaction, client) => {
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith("reminder-")) {
      await handleReminderSettingsInteraction(interaction, client);
    }
  }
};
