import {
    SlashCommandBuilder,
} from 'discord.js';
import { viewChecklist } from './Checklist/viewChecklist.js';
import { createChecklist } from './Checklist/createChecklist.js';

const commandInfo = {
    name: "checklist",
    description: "Tasks checklist for today/this week"
}

export default {
    data: new SlashCommandBuilder()
        .setName(commandInfo.name)
        .setDescription(commandInfo.description)
        .addSubcommand(
            subcommand => subcommand
                .setName(`view`)
                .setDescription(`Show today's checklist (auto-adjusted by weekday)`)
                .addStringOption(option =>
                    option.setName("type")
                        .setDescription("Checklist type default by daily (e.g. daily, weekly)")
                        .setRequired(false)
                        .addChoices(
                            { name: "DAILY", value: "daily" },
                            { name: "WEEKLY", value: "weekly" },
                        )
                ))
        .addSubcommand(subcommand => subcommand
            .setName("create")
            .setDescription("Create a new checklist (e.g. weekly, daily, event-based).")
            .addStringOption(option =>
                option
                    .setName("type")
                    .setDescription("Checklist type default by daily (e.g. daily, weekly)")
                    .setRequired(false)
                    .addChoices(
                        { name: "DAILY", value: "daily" },
                        { name: "WEEKLY", value: "weekly" },
                    ))
        ),
    run: async ({ interaction, client }) => {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "view") return viewChecklist(interaction, client);
        if (subcommand === "create") return createChecklist(interaction, client);
    }
};