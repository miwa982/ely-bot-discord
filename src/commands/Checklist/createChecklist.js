import ChecklistSchema from "../../db/Checklist/checklistSchema.js"
import { getFormatedTodayDate, getFormattedWeekRangeUTC7, getTodayRangeUTC, getWeekRangeUTC } from '../../utils/date.js';

export async function createChecklist(interaction, client) {
    const tag = interaction.user.tag;
    const [type] = [interaction.options.getString("type") ?? "daily"];
    const { start, end } =
      !type || type === "daily" ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

    // Check if today's checklist already exists
    const existing = await ChecklistSchema.findOne({
      ownerName: tag,
      createdAt: { $gte: start, $lte: end },
      $or: [{ type: type }, { type: { $exists: false } }, { type: null }],
    });

    if (existing) {
      const messageCon = !type || type === "daily" ? "today" : "this week";
      return interaction.reply({
        content: `⚠️ You already have a checklist for ${messageCon}: **${existing.title}**`,
        ephemeral: true,
      });
    }

    // Get optional fields
    const getTitleByType = (title, type) => {
      if (!type || type === "daily") {
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
      type: type ?? "daily",
      description: description,
      ownerName: tag,
      items: [],
    });

    return interaction.reply({
        content: `✅ Created checklist **${newChecklist.title}** ${description ? `— *${description}*` : ""}`,
        ephemeral: true
    });
}


