import { CronJob } from "cron";
import { BOT_CONFIG, CHECKLIST_TYPES, TASK_STATUSES } from "../../constants/bot.js";
import ChecklistSchema from "../../db/Checklist/checklistSchema.js";
import TaskSchema from "../../db/Checklist/taskSchema.js";
import { getFormatedTodayDate, getTodayRangeUTC } from "../../utils/date.js";
import { resolveGuildChannel } from "../../utils/guildConfig.js";

export default async (client) => {
  console.log(`Daily checklist creation scheduler running...`);

  // Create daily checklists at 00:00 UTC+7
  new CronJob(
    "0 0 * * *",
    async () => {
      console.log("📅 Creating daily checklists for all servers and users...");

      const guilds = Array.from(client.guilds.cache.values());
      const { start, end } = getTodayRangeUTC(7);

      for (const guild of guilds) {
        try {
          const channel = await resolveGuildChannel(guild, "checklist", client);
          if (!channel || !channel.isTextBased()) continue;

          // Fetch members (excluding bots)
          const members = await guild.members.fetch().catch(() => guild.members.cache);
          const activeMembers = members.filter((member) => !member.user.bot);

          for (const member of activeMembers.values()) {
            const tag = member.user.tag;

            const existingChecklist = await ChecklistSchema.findOne({
              ownerName: tag,
              createdAt: { $gte: start, $lte: end },
              type: CHECKLIST_TYPES.DAILY,
            });

            if (existingChecklist) continue;

            const title = `Daily Checklist (${getFormatedTodayDate()})`;

            try {
              const newChecklist = await ChecklistSchema.create({
                title: title,
                type: CHECKLIST_TYPES.DAILY,
                description: "Auto-generated daily checklist",
                ownerName: tag,
                ownerId: member.id,
                guildId: guild.id,
                items: [],
                channelId: channel.id,
              });

              // Copy unfinished tasks from yesterday's checklist
              const { start: yesterdayStart, end: yesterdayEnd } = getTodayRangeUTC(7, -1);
              const yesterdayChecklist = await ChecklistSchema.findOne({
                ownerName: tag,
                createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
                type: CHECKLIST_TYPES.DAILY,
              });

              if (yesterdayChecklist) {
                const unfinishedTasks = await TaskSchema.find({
                  checklistId: yesterdayChecklist._id.toString(),
                  status: { $ne: TASK_STATUSES.DONE },
                });

                for (const task of unfinishedTasks) {
                  const newTask = await TaskSchema.create({
                    checklistId: newChecklist._id.toString(),
                    title: task.title,
                    status: TASK_STATUSES.TODO,
                  });
                  newChecklist.items.push(newTask._id);
                }
                await newChecklist.save();
              }

              await channel.send(
                `📅 <@${member.id}> Your daily checklist has been created: **${newChecklist.title}**`,
              );
            } catch (error) {
              console.error(`❌ Error creating daily checklist for ${tag} in guild ${guild.id}:`, error);
            }
          }
        } catch (guildErr) {
          console.error(`Error processing checklist creation for guild ${guild.id}:`, guildErr);
        }
      }

      console.log("📅 Daily checklist creation completed across all servers.");
    },
    null,
    true,
    BOT_CONFIG.DEFAULT_TIMEZONE,
  );
};
