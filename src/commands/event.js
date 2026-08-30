import { SlashCommandBuilder } from "discord.js";
import { buildEventDashboard } from "../components/Event/eventDashboard.js";
import createEventModal from "../components/Modals/createEventModal.js";

const commandInfo = {
  name: "event",
  description: "Interactive game events & recurring schedules manager",
};

export default {
  data: new SlashCommandBuilder()
    .setName(commandInfo.name)
    .setDescription(commandInfo.description)
    .addSubcommand((sub) =>
      sub
        .setName("dashboard")
        .setDescription("Open the interactive event & schedule dashboard"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Open the interactive event creation modal"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("View all active and upcoming game events"),
    ),

  run: async ({ interaction }) => {
    let subcommand = "dashboard";
    try {
      subcommand = interaction.options.getSubcommand();
    } catch {
      subcommand = "dashboard";
    }

    if (subcommand === "create") {
      const modal = createEventModal.build();
      return interaction.showModal(modal);
    }

    // Default to dashboard
    const dashboard = await buildEventDashboard(interaction.guildId);
    return interaction.reply({
      embeds: dashboard.embeds,
      components: dashboard.components,
    });
  },
};
