import {
    SlashCommandBuilder,
    EmbedBuilder
} from "discord.js";
import { Pagination } from "pagination.djs";
import { createChecklist } from "../db/Checklist/createChecklist.js";
import ChecklistSchema from "../db/Checklist/checklistSchema.js";
import { getTodayRangeUTC, getWeekRangeUTC } from "../utils/date.js";
import { removeChecklist } from "../db/Checklist/removeChecklist.js";
import TaskStatusType from "../enum/TaskStatusType.js";

const commandInfo = {
    name: "checklist",
    description: "Tasks checklist for today"
}

const checkListTypeEnum = {
    DAILY: { name: 'DAILY', code: 'daily' },
    WEEKLY: { name: 'WEEKLY', code: 'weekly' },
}

async function sendTasksChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const type = interaction.options.getString("type");
    const isReset = interaction.options.getString("is_reset");
    const isResetStatus = interaction.options.getString("is_reset_status");
    const { start, end } = (!type || type === 'daily') ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

    
    const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        createdAt: { $gte: start, $lte: end },
        type: type,
        // isReset: isReset === 'true' ? true : false,
        // isResetStatus: isResetStatus === 'true' ? true : false
    }).populate("items");

    if (!checklist) {
        if (!type || type === checkListTypeEnum.DAILY.code) {
            return interaction.reply({
                content: `❌ No checklist found for today. Use \`/checklist create\` first.`,
                ephemeral: true
            });
        }

        if (type === checkListTypeEnum.WEEKLY.code) {
            return interaction.reply({
                content: `❌ No checklist found for this week. Use \`/checklist create type:WEEKLY\` first.`,
                ephemeral: true
            });
        }
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
            .setTitle(`${checklist.title} (${checklist.type ?? 'daily'})`)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
            .setThumbnail("https://i.redd.it/wqiml59f50ob1.jpg")
            .setColor(0xec82b0)
            .setDescription(
                slice && slice.length > 0 ?
                    slice.map((task, idx) => `**${i + idx + 1}.** ${task.title} — \`${statusMap[task.status] || task.status
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
                    .setName("title")
                    .setDescription("Optional title for the checklist")
                    .setRequired(false)
            )
            .addStringOption(option =>
                option
                    .setName("description")
                    .setDescription("Optional description for the checklist")
                    .setRequired(false)
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
            .addStringOption(option =>
                option
                    .setName("is_reset")
                    .setDescription("Checklist reset daily/weekly")
                    .setRequired(false)
                    .addChoices(
                        { name: 'true', value: 'true' },
                        { name: 'false', value: 'false' },
                    ))
            .addStringOption(option =>
                option
                    .setName("is_reset_status")
                    .setDescription("Checklist type default by daily (e.g. daily, weekly)")
                    .setRequired(false)
                    .addChoices(
                        { name: 'true', value: 'true' },
                        { name: 'false', value: 'false' },
                    ))
        ).addSubcommand((subcommand) => subcommand
            .setName("remove")
            .setDescription("Remove today's checklist.")
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
        if (subcommand === "view") return sendTasksChecklist(interaction, client);
        if (subcommand === "create") return createChecklist(interaction, client);
        if (subcommand === "remove") return removeChecklist(interaction, client);
    }
};