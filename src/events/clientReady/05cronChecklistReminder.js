import { CronJob } from "cron";
import { BOT_CONFIG, CHECKLIST_TYPES } from "../../constants/bot.js";
import ChecklistSchema from "../../db/Checklist/checklistSchema.js";
import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import TaskStatusType from "../../enum/TaskStatusType.js";
import { resolveGuildChannel } from "../../utils/guildConfig.js";

async function getChannelForChecklist(client, checklist) {
  if (checklist.channelId) {
    const directChannel = await client.channels.fetch(checklist.channelId).catch(() => null);
    if (directChannel && directChannel.isTextBased()) return directChannel;
  }

  if (checklist.guildId) {
    const guild = client.guilds.cache.get(checklist.guildId);
    if (guild) {
      return resolveGuildChannel(guild, "checklist", client);
    }
  }

  // Fallback to first guild
  const firstGuild = client.guilds.cache.first();
  return firstGuild ? resolveGuildChannel(firstGuild, "checklist", client) : null;
}

export default (client) => {
  // Daily task reminder at 18:00 UTC+7
  new CronJob(
    "0 18 * * *",
    async () => {
      const { start, end } = getTodayRangeUTC(7);
      const todayChecklists = await ChecklistSchema.find({
        createdAt: { $gte: start, $lte: end },
        type: CHECKLIST_TYPES.DAILY,
      }).populate("items");

      for (const checklist of todayChecklists) {
        const pendingTasks = checklist.items.filter(
          (task) => task.status !== TaskStatusType.DONE,
        );

        if (pendingTasks.length === 0) continue;

        const taskList = pendingTasks
          .map((task, idx) => `${idx + 1}. ${task.title}`)
          .join("\n");
        const message = `⏰ <@${checklist.ownerId}> Reminder for your daily checklist:\n${taskList}`;

        try {
          const channel = await getChannelForChecklist(client, checklist);
          if (channel) await channel.send(message);
        } catch (err) {
          console.error(`❌ Error sending daily reminder for checklist ${checklist.title}:`, err);
        }
      }
    },
    null,
    true,
    BOT_CONFIG.DEFAULT_TIMEZONE,
  );

  // Weekly task reminder every day at 18:00 UTC+7
  new CronJob(
    "0 18 * * *",
    async () => {
      const { start, end } = getWeekRangeUTC(7, 0);
      const weeklyChecklists = await ChecklistSchema.find({
        createdAt: { $gte: start, $lte: end },
        type: CHECKLIST_TYPES.WEEKLY,
      }).populate("items");

      for (const checklist of weeklyChecklists) {
        const pendingTasks = checklist.items.filter(
          (task) => task.status !== TaskStatusType.DONE,
        );
        if (pendingTasks.length === 0) continue;

        const taskList = pendingTasks
          .map((task, idx) => `${idx + 1}. ${task.title}`)
          .join("\n");
        const message = `⏰ <@${checklist.ownerId}> Reminder for your weekly checklist:\n${taskList}`;

        try {
          const channel = await getChannelForChecklist(client, checklist);
          if (channel) await channel.send(message);
        } catch (err) {
          console.error(`❌ Error sending weekly reminder for checklist ${checklist.title}:`, err);
        }
      }
    },
    null,
    true,
    BOT_CONFIG.DEFAULT_TIMEZONE,
  );
};
