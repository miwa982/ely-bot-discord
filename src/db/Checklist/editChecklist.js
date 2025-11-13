import ChecklistSchema from "../Checklist/checklistSchema.js";
import { getFormatedTodayDate, getFormattedWeekRangeUTC7, getTodayRangeUTC, getWeekRangeUTC } from '../../utils/date.js';

export async function editChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const type = interaction.options.getString("type") ?? 'daily';
    const { start, end } = (!type || type === 'daily') ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

    // Find the checklist for today/week
    const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        createdAt: { $gte: start, $lte: end },
        $or: [
            { type: type },
            { type: { $exists: false } },
            { type: null }
        ]
    });

    if (!checklist) {
        const messageCon = type === 'daily' ? 'today' : 'this week';
        return interaction.reply({
            content: `⚠️ No checklist found for ${messageCon}. Use \`/checklist create\` first.`,
            ephemeral: true
        });
    }

    // Update fields if provided
    const newTitleInput = interaction.options.getString("title") ?? '';
    const newDescription = interaction.options.getString("description") ?? '';
    const newIsReset = interaction.options.getString("is_reset") ?? 'false';
    const newIsResetStatus = interaction.options.getString("is_reset_status") ?? 'true';

    // Helper for generating default title if none is provided
    const getTitleByType = (title, type) => {
        if (!type || type === 'daily') {
            return title ? `${title} (${getFormatedTodayDate()})` : `Checklist (${getFormatedTodayDate()})`;
        }
        return title ? `${title} (${getFormattedWeekRangeUTC7()})` : `Checklist (${getFormattedWeekRangeUTC7()})`;
    }

    checklist.title = getTitleByType(newTitleInput, type);
    checklist.description = newDescription;
    checklist.isReset = newIsReset === 'true';
    checklist.isResetStatus = newIsResetStatus === 'true';

    await checklist.save();

    return interaction.reply({
        content: `✅ Updated checklist **${checklist.title}** ${checklist.description ? `— *${checklist.description}*` : ""}`,
        ephemeral: true
    });
}
