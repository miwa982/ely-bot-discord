import ChecklistSchema from "../../db/Checklist/checklistSchema.js"
import { CHECKLIST_TYPES, DISCORD_FLAGS } from "../../constants/bot.js";
import { getFormatedTodayDate, getFormattedWeekRangeUTC7, getTodayRangeUTC, getWeekRangeUTC } from '../../utils/date.js';

export async function createChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const type = interaction.options.getString("type") ?? CHECKLIST_TYPES.DAILY;
    const { start, end } =
      type === CHECKLIST_TYPES.DAILY ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

    // Check if today's checklist already exists
    const existing = await ChecklistSchema.findOne({
      ownerName: tag,
      createdAt: { $gte: start, $lte: end },
      $or: [{ type: type }, { type: { $exists: false } }, { type: null }],
    });

    if (existing) {
      const messageCon = type === CHECKLIST_TYPES.DAILY ? "today" : "this week";
      return interaction.reply({
        content: `⚠️ You already have a checklist for ${messageCon}: **${existing.title}**`,
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    // Keep checklist titles anchored to the same date window used by queries.
    const getTitleByType = (title, type) => {
      if (type === CHECKLIST_TYPES.DAILY) {
        return title
          ? title + `(${getFormatedTodayDate()})`
          : `Checklist (${getFormatedTodayDate()})`;
      }
      return title
        ? title + `(${getFormattedWeekRangeUTC7()})`
        : `Checklist (${getFormattedWeekRangeUTC7()})`;
    };
    const title = getTitleByType(interaction.options.getString("title"), type);

    const description = interaction.options.getString("description") || "";

    const newChecklist = await ChecklistSchema.create({
      title: title,
      type,
      description: description,
      ownerName: tag,
      ownerId: interaction.user.id,
      items: [],
    });

    return interaction.reply({
        content: `✅ Created checklist **${newChecklist.title}** ${description ? `— *${description}*` : ""}`,
        flags: DISCORD_FLAGS.EPHEMERAL
    });
}
