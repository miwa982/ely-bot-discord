import {
    SlashCommandBuilder,
    EmbedBuilder
} from "discord.js";
import { Pagination } from "pagination.djs";
import { createChecklist } from "../db/Checklist/createChecklist.js";
import ChecklistSchema from "../db/Checklist/checklistSchema.js";
import { getTodayRangeUTC } from "../utils/date.js";
import { removeChecklist } from "../db/Checklist/removeChecklist.js";
import TaskStatusType from "../enum/TaskStatusType.js";

const commandInfo = {
    name: "checklist",
    description: "Tasks checklist for today"
}

async function sendTasksChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const { start, end } = getTodayRangeUTC(7);

    const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        createdAt: { $gte: start, $lte: end }
    }).populate("items");

    if (!checklist) {
        return interaction.reply({
            content: `❌ No checklist found for today. Use \`/checklist create\` first.`,
            ephemeral: true
        });
    }

    const tasksPerPage = 5;
    const pages = [];
    const statusMap = {
        TODO: "TODO 👀",
        IN_PROGRESS: "IN PROGRESS... ⌛",
        DONE: "DONE ✅"
    };

    const countDoneTasks = (items) => {
        return items.filter(item => item.status === TaskStatusType.DONE).length;
    }

    for (let i = 0; i <= checklist.items.length; i += tasksPerPage) {
        const slice = checklist.items.slice(i, i + tasksPerPage);
        const embed = new EmbedBuilder()
            .setTitle(checklist.title)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
            .setThumbnail("https://i.redd.it/wqiml59f50ob1.jpg")
            .setColor(0xec82b0)
            .setDescription(
                slice && slice.length > 0 ?
                    slice.map((task, idx) => `**${i + idx + 1}.** ${task.title} — \`${
                        // TODO: "TODO 👀",
                        // IN_PROGRESS: "IN PROGRESS... ⌛",
                        // DONE: "DONE ✅"
                        statusMap[task.status] || task.status
                        }\``).join("\n")
                    : "✨ No tasks yet. Use `/task add` to add one!"
            )
            .setTimestamp();

        pages.push(embed);
    }

    // ✅ DO NOT reply manually — let pagination handle first reply
    const pagination = new Pagination(interaction, {
        ephemeral: false, // must not be ephemeral
        time: 120_000,
    });

    const doneCount = countDoneTasks(checklist.items);
    const progressString = `✅ ${doneCount}/${checklist.items.length} completed`
    pagination.setEmbeds(pages, (embed, index, array) => {
        return embed.setFooter({ text: `${progressString}\nPage: ${index + 1}/${array.length}` });
    });

    try {
        await pagination.render();
    } catch (err) {
        if (err.code === 10062) {
            console.log("Interaction expired — sending fallback message.");
            await interaction.channel.send("⚠️ Checklist expired, please run `/checklist view` again.");
        } else {
            throw err;
        }
    }

    // Fetch the actual message created by pagination
    const sentMessage = await interaction.fetchReply();

    checklist.lastMessageId = sentMessage.id;
    checklist.channelId = sentMessage.channel.id;
    await checklist.save();
}

export default {
  data: new SlashCommandBuilder()
    .setName(commandInfo.name)
        .setDescription(commandInfo.description)
        .addSubcommand(
            (subcommand) => subcommand
                .setName(`view`)
                .setDescription(`Show today's checklist (auto-adjusted by weekday)`))
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create a new checklist (e.g. weekly, daily, event-based).")
                .addStringOption((option) =>
                    option
                        .setName("title")
                        .setDescription("Optional title for the checklist")
                        .setRequired(false)
                )
                .addStringOption((option) =>
                    option
                        .setName("description")
                        .setDescription("Optional description for the checklist")
                        .setRequired(false)
                )
        ).addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Remove today's checklist.")
),
  run: async ({ interaction, client }) => {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "view") return sendTasksChecklist(interaction, client);
    if (subcommand === "create") return createChecklist(interaction, client);
    if (subcommand === "remove") return removeChecklist(interaction, client);
  }
};