import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { BOT_CONFIG, CHECKLIST_TYPES, DISCORD_FLAGS, TASK_STATUS_UI, TASK_STATUSES } from "../../constants/bot.js";
import ChecklistSchema from "../../db/Checklist/checklistSchema.js"

export async function viewChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const type = interaction.options.getString("type") ?? CHECKLIST_TYPES.DAILY;
    const { start, end } = type === CHECKLIST_TYPES.DAILY ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

    const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        createdAt: { $gte: start, $lte: end },
        $or: [
            { type: type },
            { type: { $exists: false } },
            { type: null }
        ],
    }).populate("items");

    if (!checklist) {
        if (type === CHECKLIST_TYPES.DAILY) {
            return interaction.reply({
                content: `❌ No checklist found for today. Use \`/checklist create\` first.`,
                flags: DISCORD_FLAGS.EPHEMERAL
            });
        }

        if (type === CHECKLIST_TYPES.WEEKLY) {
            return interaction.reply({
                content: `❌ No checklist found for this week. Use \`/checklist create type:WEEKLY\` first.`,
                flags: DISCORD_FLAGS.EPHEMERAL
            });
        }
    }

    const countDoneTasks = (items) => {
        return items.filter(item => item.status === TASK_STATUSES.DONE).length;
    }

    const doneCount = countDoneTasks(checklist.items);
    const progressString = `✅ ${doneCount}/${checklist.items.length} completed`;

    const embed = new EmbedBuilder()
      .setTitle(`${checklist.title} (${checklist.type ?? CHECKLIST_TYPES.DAILY})`)
      .setAuthor({
        name: interaction.user.tag,
        iconURL: interaction.user.avatarURL(),
      })

      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setDescription(
        checklist.items && checklist.items.length > 0
          ? // @ts-ignore
            checklist.items
              .map(
                (task, idx) =>
                  `**${idx + 1}.** ${task.title} — \`${TASK_STATUS_UI[task.status]?.name ?? task.status}\``,
              )
              .join("\n")
          : `✨ No tasks yet. Click **"📋 Add"** button to add one!`,
      )
      .setFooter({ text: `${progressString}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`btn-add-task:${type}`)
            .setLabel('📋 Add')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId(`btn-edit-task:${type}`)
            .setLabel('📝 Edit')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId(`btn-delete-task:${type}`)
            .setLabel('❌ Delete')
            .setStyle(ButtonStyle.Secondary)
    )

    await interaction.reply({
        embeds: [embed],
        components: [row],
    })

    const sentMessage = await interaction.fetchReply();

    checklist.lastMessageId = sentMessage.id;
    checklist.channelId = sentMessage.channel.id;
    await checklist.save();

}
