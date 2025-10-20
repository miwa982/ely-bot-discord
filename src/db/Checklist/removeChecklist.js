import ChecklistSchema from "./checklistSchema.js";
import { getTodayRangeUTC } from "../../utils/date.js";

export async function removeChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const { start, end } = getTodayRangeUTC(7);

    // Find checklist for today
    const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        createdAt: { $gte: start, $lte: end }
    });

    if (!checklist) {
        return interaction.reply({
            content: `❌ No checklist found for today.`,
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
