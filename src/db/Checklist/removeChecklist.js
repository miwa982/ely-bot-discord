import ChecklistSchema from "./checklistSchema.js";
import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";

export async function removeChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const type = interaction.options.getString("type");
    const { start, end } = (!type || type === 'daily') ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

    // Find checklist for today
    const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        type: type,
        createdAt: { $gte: start, $lte: end }
    });

    if (!checklist) {
        const messageCon = (!type || type === 'daily') ? 'today' : 'this week';
        return interaction.reply({
            content: `❌ No checklist found for ${messageCon}.`,
            ephemeral: true
        });
    }

    // Delete the checklist
    await ChecklistSchema.deleteOne({ _id: checklist._id });

    return interaction.reply({
        content: `🗑️ Checklist **${checklist.title}** has been removed.`,
        ephemeral: true
    });
}
