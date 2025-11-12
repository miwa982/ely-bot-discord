import ChecklistSchema from "./checklistSchema.js";
import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import { EmbedBuilder } from "discord.js";
import TaskStatusType from "../../enum/TaskStatusType.js";

export async function editTask(interaction, client) {
    const tag = interaction.user.tag;
    const taskNumber = interaction.options.getInteger("task_number");
    const newTitle = interaction.options.getString("title");
    const newStatus = interaction.options.getString("status");
    const type = interaction.options.getString("type") ?? 'daily';

    const { start, end } = (!type || type === 'daily') ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

    // Find today's checklist
    const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        type: type,
        createdAt: { $gte: start, $lte: end }
    }).populate("items");

    if (!checklist) {
        const messageCon = (!type || type === 'daily') ? 'today' : 'this week';
        return interaction.reply({
            content: `❌ No checklist found for ${messageCon}.`,
            ephemeral: true
        });
    }

    if (taskNumber < 1 || taskNumber > checklist.items.length) {
        return interaction.reply({
            content: `⚠️ Invalid task number. Please choose between 1 and ${checklist.items.length}.`,
            ephemeral: true
        });
    }

    // Find the task
    const task = checklist.items[taskNumber - 1];

    if (newTitle) task.title = newTitle;
    if (newStatus) task.status = newStatus;

    await task.save();

    // Rebuild embeds
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

    for (let i = 0; i < checklist.items.length; i += tasksPerPage) {
        const slice = checklist.items.slice(i, i + tasksPerPage);
        const doneCount = countDoneTasks(checklist.items);
        const progressString = `✅ ${doneCount}/${checklist.items.length} completed`
        const embed = new EmbedBuilder()
            .setTitle(checklist.title)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })

            .setColor(0xec82b0)
            .setDescription(
                slice && slice.length > 0 ?
                    slice.map((task, idx) => `**${i + idx + 1}.** ${task.title} — \`${
                        statusMap[task.status] || task.status
                        }\``).join("\n")
                    : "✨ No tasks yet. Use `/task add` to add one!"
            )
            .setTimestamp()
            .setFooter({
                text: `${progressString}\nPage: ${Math.floor(i / tasksPerPage) + 1}/${Math.ceil(checklist.items.length / tasksPerPage)}`
            });

        pages.push(embed);
    }

    interaction.reply({
        content: `✅ Task **${taskNumber}** updated to: **${task.title}** — \`${task.status}\``,
        ephemeral: true
    });

    // if (checklist.lastMessageId && checklist.channelId) {
    //     const channel = await client.channels.fetch(checklist.channelId);
    //     const message = await channel.messages.fetch(checklist.lastMessageId);
    //     await message.edit({ embeds: [pages[0]] }); // refresh the embed
    // }

    // Update old checklist message if it exists
    if (checklist.lastMessageId && checklist.channelId) {
        try {
            const channel = await client.channels.fetch(checklist.channelId);
            const message = await channel.messages.fetch(checklist.lastMessageId);

            await message.edit({ embeds: [pages[0]] });
        } catch (err) {
            console.error("❌ Failed to update old checklist message:", err);
        }
    }
}
