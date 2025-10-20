import ChecklistSchema from "../Checklist/checklistSchema.js"
import { getFormatedDate, getTodayRangeUTC } from '../../utils/date.js';

export async function createChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const { start, end } = getTodayRangeUTC(7);

    // Check if today's checklist already exists
    const existing = await ChecklistSchema.findOne({
        ownerName: tag,
        createdAt: { $gte: start, $lte: end }
    });

    if (existing) {
        return interaction.reply({
            content: `⚠️ You already have a checklist for today: **${existing.title}**`,
            ephemeral: true
        });
    }

    // Get optional fields
    const title = interaction.options.getString("title") ?
        interaction.options.getString("title") + `(${getFormatedDate()})` :
        `Checklist (${getFormatedDate()})`;
        
    const description = interaction.options.getString("description") || "";

    const newChecklist = await ChecklistSchema.create({
        title,
        description,
        ownerName: tag,
        items: []
    });

    return interaction.reply({
        content: `✅ Created checklist **${newChecklist.title}** ${description ? `— *${description}*` : ""}`,
        ephemeral: true
    });
}


