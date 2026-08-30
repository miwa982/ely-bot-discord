import ChecklistSchema from "../Checklist/checklistSchema.js";
import { CHECKLIST_TYPES, DISCORD_FLAGS } from "../../constants/bot.js";
import { getFormatedTodayDate, getFormattedWeekRangeUTC7, getTodayRangeUTC, getWeekRangeUTC } from '../../utils/date.js';

export async function editChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const type = interaction.options.getString("type") ?? CHECKLIST_TYPES.DAILY;
    const { start, end } = type === CHECKLIST_TYPES.DAILY ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

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
        const messageCon = type === CHECKLIST_TYPES.DAILY ? 'today' : 'this week';
        return interaction.reply({
            content: `⚠️ No checklist found for ${messageCon}. Use \`/checklist create\` first.`,
            flags: DISCORD_FLAGS.EPHEMERAL
        });
    }

    // Update fields if provided
    const newTitleInput = interaction.options.getString("title") ?? '';
    const newDescription = interaction.options.getString("description") ?? "";

    // Helper for generating default title if none is provided
    const getTitleByType = (title, type) => {
      if (type === CHECKLIST_TYPES.DAILY) {
        return title
          ? `${title} (${getFormatedTodayDate()})`
          : `Checklist (${getFormatedTodayDate()})`;
      }
      return title
        ? `${title} (${getFormattedWeekRangeUTC7()})`
        : `Checklist (${getFormattedWeekRangeUTC7()})`;
    };

    checklist.title = getTitleByType(newTitleInput, type);
    checklist.description = newDescription;

    await checklist.save();

    return interaction.reply({
        content: `✅ Updated checklist **${checklist.title}** ${checklist.description ? `— *${checklist.description}*` : ""}`,
        flags: DISCORD_FLAGS.EPHEMERAL
    });
}
