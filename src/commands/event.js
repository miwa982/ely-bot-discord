import { SlashCommandBuilder } from "discord.js";
import {
  buildEditSelectMenu,
  buildEventDashboard,
  buildEventList,
} from "../components/Event/eventDashboard.js";
import createEventModal from "../components/Modals/createEventModal.js";
import { DISCORD_FLAGS } from "../constants/bot.js";

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
        .setDescription("Open the interactive event & schedule management dashboard"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("View the public game timetable and active event schedules"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Open the interactive event creation modal"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Select and edit an existing game event or schedule"),
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

    if (subcommand === "edit") {
      const dashboard = await buildEventDashboard(interaction.guildId);
      if (dashboard.events.length === 0) {
        return interaction.reply({
          content: "ℹ️ No events found to edit. Use `/event create` or `/event dashboard` to add one first!",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      const editRow = buildEditSelectMenu(dashboard.events);
      return interaction.reply({
        content: "🌸 Select which event you want to edit:",
        components: [editRow],
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    if (subcommand === "list") {
      const list = await buildEventList(interaction.guildId);
      return interaction.reply({
        embeds: list.embeds,
        components: list.components,
      });
    }

    // Default to management dashboard
    const dashboard = await buildEventDashboard(interaction.guildId);
    return interaction.reply({
      embeds: dashboard.embeds,
      components: dashboard.components,
    });
  },
};
