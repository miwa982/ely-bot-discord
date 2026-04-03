import { CronJob } from "cron";
import ChecklistSchema from "../../db/Checklist/checklistSchema.js";
import TaskSchema from "../../db/Checklist/taskSchema.js";
import { getFormatedTodayDate, getTodayRangeUTC } from "../../utils/date.js";

export default async (c, client, handler) => {
  console.log(`Daily checklist creation scheduler running...`);

  // 🕕 Create daily checklists at 06:00 UTC+7
  new CronJob(
    "0 6 * * *",
    async () => {
      console.log("📅 Creating daily checklists for all users...");

      const guildId = process.env.GUILD_ID
        ? JSON.parse(process.env.GUILD_ID)[1]
        : null;
      if (!guildId) {
        console.error("❌ GUILD_ID not set in environment variables");
        return;
      }

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        console.error("❌ Guild not found");
        return;
      }

      const channel = c.channels.cache.get(process.env.DAILY_CHANNEL_ID);
      if (!channel) {
        console.error("❌ Daily channel not found");
        return;
      }

      const { start, end } = getTodayRangeUTC(7); // today's range in UTC+7

      // Get all guild members (excluding bots)
      const members = guild.members.cache.filter((member) => !member.user.bot);

      for (const member of members.values()) {
        const tag = member.user.tag;

        // Check if user already has a daily checklist today
        const existingChecklist = await ChecklistSchema.findOne({
          ownerName: tag,
          createdAt: { $gte: start, $lte: end },
          type: "daily",
        });

        if (existingChecklist) {
          console.log(
            `✅ ${tag} already has a daily checklist: ${existingChecklist.title}`,
          );
          continue;
        }

        // Create new daily checklist
        const title = `Daily Checklist (${getFormatedTodayDate()})`;

        try {
          const newChecklist = await ChecklistSchema.create({
            title: title,
            type: "daily",
            description: "Auto-generated daily checklist",
            ownerName: tag,
            ownerId: member.id,
            items: [],
            channelId: channel.id, // Store channel ID for reminders
          });

          // Copy unfinished tasks from yesterday's checklist
          const { start: yesterdayStart, end: yesterdayEnd } = getTodayRangeUTC(
            7,
            -1,
          );
          const yesterdayChecklist = await ChecklistSchema.findOne({
            ownerName: tag,
            createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
            type: "daily",
          });

          if (yesterdayChecklist) {
            const unfinishedTasks = await TaskSchema.find({
              checklistId: yesterdayChecklist._id.toString(),
              status: { $ne: "DONE" },
            });
            for (const task of unfinishedTasks) {
              const newTask = await TaskSchema.create({
                checklistId: newChecklist._id.toString(),
                title: task.title,
                status: "TODO",
              });
              newChecklist.items.push(newTask._id);
            }
            await newChecklist.save();
          }

          console.log(
            `✅ Created daily checklist for ${tag}: ${newChecklist.title} with ${newChecklist.items.length} tasks`,
          );

          // Send notification
          await channel.send(
            `📅 <@${member.id}> Your daily checklist has been created: **${newChecklist.title}**`,
          );
        } catch (error) {
          console.error(`❌ Error creating daily checklist for ${tag}:`, error);
          await channel.send(
            `❌ Error creating daily checklist for <@${member.id}>`,
          );
        }
      }

      console.log("📅 Daily checklist creation completed.");
    },
    null,
    true,
    "Asia/Bangkok",
  );
};
