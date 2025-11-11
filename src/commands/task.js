import { SlashCommandBuilder } from "discord.js";
import { addTask } from "../db/Checklist/addTask.js";
import { editTask } from "../db/Checklist/editTask.js";
import { removeTask } from "../db/Checklist/removeTask.js";

export default {
    data: new SlashCommandBuilder()
        .setName("task")
        .setDescription("Manage tasks in your checklist")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Add a new task to a checklist.")
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("Name of the task")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("type")
                        .setDescription("Checklist type default by daily (e.g. daily, weekly)")
                        .setRequired(false)
                        .addChoices(
                            { name: "DAILY", value: "daily" },
                            { name: "WEEKLY", value: "weekly" },
                        ))

        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("edit")
                .setDescription("Edit a task in today's checklist.")
                .addIntegerOption((option) =>
                    option
                        .setName("task_number")
                        .setDescription("Which task number to edit (1, 2, 3...)")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("title")
                        .setDescription("New title for the task")
                        .setRequired(false)
                )
                .addStringOption((option) =>
                    option
                        .setName("status")
                        .setDescription("New status")
                        .setRequired(false)
                        .addChoices(
                            { name: "TODO 👀", value: "TODO" },
                            { name: "IN PROGRESS... ⌛", value: "IN_PROGRESS" },
                            { name: "DONE ✅", value: "DONE" }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName("type")
                        .setDescription("Checklist type default by daily (e.g. daily, weekly)")
                        .setRequired(false)
                        .addChoices(
                            { name: "DAILY", value: "daily" },
                            { name: "WEEKLY", value: "weekly" },
                        ))
        ).addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Remove a task from today's checklist.")
                .addIntegerOption((option) =>
                    option
                        .setName("task_number")
                        .setDescription("Which task number to remove (1, 2, 3...)")
                        .setRequired(true)
                )
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
        if (subcommand === "add") return addTask(interaction, client);
        if (subcommand === "edit") return editTask(interaction, client);
        if (subcommand === "remove") return removeTask(interaction, client);
    }
};
