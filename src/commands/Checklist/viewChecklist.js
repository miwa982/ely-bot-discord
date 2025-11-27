import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import ChecklistSchema from "../../db/Checklist/checklistSchema.js"
import enumData from "../../enum/enumData.js"

export async function viewChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const type = interaction.options.getString("type") ?? 'daily';
    const { start, end } = (!type || type === 'daily') ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

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
        if (!type || type === enumData.ChecklistType.DAILY.code) {
            return interaction.reply({
                content: `❌ No checklist found for today. Use \`/checklist create\` first.`,
                ephemeral: true
            });
        }

        if (type === enumData.ChecklistType.WEEKLY.code) {
            return interaction.reply({
                content: `❌ No checklist found for this week. Use \`/checklist create type:WEEKLY\` first.`,
                ephemeral: true
            });
        }
    }

    const countDoneTasks = (items) => {
        return items.filter(item => item.status === enumData.TaskStatusType.DONE.code).length;
    }

    const doneCount = countDoneTasks(checklist.items);
    const progressString = `✅ ${doneCount}/${checklist.items.length} completed`
    const checklistStatusString = `${checklist.isReset ? enumData.ChecklistStatus.RESET?.icon : enumData.ChecklistStatus.NOT_RESET?.icon} | ${checklist.isResetStatus ? enumData.ChecklistStatus.RESET_STAUTS?.icon : enumData.ChecklistStatus.NOT_RESET_STATUS?.icon}`

    const embed = new EmbedBuilder()
        .setTitle(`${checklist.title} (${checklist.type ?? 'daily'})`)
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })

        .setColor(0xec82b0)
        .setDescription(
            checklist.items && checklist.items.length > 0 ?
                // @ts-ignore
                checklist.items.map((task, idx) => `**${idx + 1}.** ${task.title} — \`${enumData.TaskStatusTypeUI[task.status].name}\``).join("\n")
                : `✨ No tasks yet. Click **"📋 Add"** button to add one!`
        )
        .setFooter({ text: `${progressString}\n${checklistStatusString}` })
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
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId(`btn-setting-checklist:${type}`)
            .setLabel('⚙️')
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