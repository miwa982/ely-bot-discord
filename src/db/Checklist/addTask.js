import TaskStatusType from "../../enum/TaskStatusType.js";
import { BOT_CONFIG, DISCORD_FLAGS, TASK_SUGGESTIONS, TASK_STATUS_UI } from "../../constants/bot.js";
import TaskSchema from "./taskSchema.js";
import ChecklistSchema from "../Checklist/checklistSchema.js"
import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import { EmbedBuilder } from "discord.js";

export async function addTask(interaction, client) {
    if (interaction.options.getSubcommand() !== "add") return;
    const taskName = interaction.options.getString("name");
    const type = interaction.options.getString("type") ?? 'daily';
    const tag = interaction.user.tag;
    const { start, end } = type === 'daily' ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

    // Find checklist
    const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        type: type ?? 'daily',
        createdAt: { $gte: start, $lte: end }
    }).populate("items");

    if (!checklist) {
        return interaction.reply({ content: "❌ Checklist not found.", flags: DISCORD_FLAGS.EPHEMERAL });
    }

    // Create task
    const task = await TaskSchema.create({
        checklistId: checklist._id,
        title: TASK_SUGGESTIONS.find(choice => choice.value === taskName)?.name || taskName,
        status: TaskStatusType.TODO,
    });

    checklist.items.push(task);
    await checklist.save();

    // Rebuild embeds
    const tasksPerPage = 5;
    const pages = [];
    const countDoneTasks = (items) => {
        return items.filter(item => item.status === TaskStatusType.DONE).length;
    }

    for (let i = 0; i <= checklist.items.length; i += tasksPerPage) {
        const slice = checklist.items.slice(i, i + tasksPerPage);
        const doneCount = countDoneTasks(checklist.items);
        const progressString = `✅ ${doneCount}/${checklist.items.length} completed`;

        const embed = new EmbedBuilder()
          .setTitle(checklist.title)
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.avatarURL(),
          })

          .setColor(BOT_CONFIG.EMBED_COLOR)
          .setDescription(
            slice && slice.length > 0
              ? slice
                  .map(
                    (task, idx) =>
                      `**${i + idx + 1}.** ${task.title} — \`${
                        TASK_STATUS_UI[task.status]?.name ?? task.status
                      }\``,
                  )
                  .join("\n")
              : `✨ No tasks yet. Click **"📋 Add"** button to add one!`,
          )
          .setTimestamp()
          .setFooter({
            text: `${progressString}\nPage: ${Math.floor(i / tasksPerPage) + 1}/${Math.ceil(checklist.items.length / tasksPerPage)}`,
          });


        pages.push(embed);
    }


    interaction.reply({
        content: `✅ Task **${taskName}** added to checklist **${checklist.title}**!`,
        flags: DISCORD_FLAGS.EPHEMERAL
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
