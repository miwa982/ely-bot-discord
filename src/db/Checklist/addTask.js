import TaskStatusType from "../../enum/TaskStatusType.js";
import TaskSchema from "./taskSchema.js";
import ChecklistSchema from "../Checklist/checklistSchema.js"
import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import { EmbedBuilder } from "discord.js";

const eventList = [
    { name: "Infinity Abyss", value: `hi3abyss` },
    { name: "Elysian Realm", value: `hi3er` },
    { name: "Memorial Arena", value: `hi3ma` },
    { name: "Spiral Abyss", value: `giabyss` },
    { name: "Imaginarium Theater", value: `githeater` },
    { name: "Stygian Onslaught", value: `giso` },
    { name: "Weekly Bosses - GI", value: `giweeklybosses` },
    { name: "Memory of Chaos", value: `hsrmoc` },
    { name: "Pure Fiction", value: `hsrpf` },
    { name: "Apocalypse Shadow", value: `hsras` },
    { name: "Simulated/Divergent/Currency", value: `hsrsuducw` },
    { name: "Weekly Bosses - HSR", value: `hsrweeklybosses` },
    { name: "Material Farming", value: `farm` },
]

export async function addTask(interaction, client) {
    if (interaction.options.getSubcommand() !== "add") return;
    const taskName = interaction.options.getString("name");
    const type = interaction.options.getString("type");
    const tag = interaction.user.tag;
    const { start, end } = type === 'daily' ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

    // Find checklist
    const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        type: type ?? 'daily',
        createdAt: { $gte: start, $lte: end }
    }).populate("items");

    if (!checklist) {
        return interaction.reply({ content: "❌ Checklist not found.", ephemeral: true });
    }

    // Create task
    const task = await TaskSchema.create({
        checklistId: checklist._id,
        title: eventList.find(choice => choice.value === taskName)?.name || taskName,
        status: TaskStatusType.TODO,
    });

    checklist.items.push(task);
    await checklist.save();

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

    for (let i = 0; i <= checklist.items.length; i += tasksPerPage) {
        const slice = checklist.items.slice(i, i + tasksPerPage);
        const doneCount = countDoneTasks(checklist.items);
        const progressString = `✅ ${doneCount}/${checklist.items.length} completed`;

        const embed = new EmbedBuilder()
            .setTitle(checklist.title)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
            .setThumbnail("https://i.redd.it/wqiml59f50ob1.jpg")
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
        content: `✅ Task **${taskName}** added to checklist **${checklist.title}**!`,
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
