import { CronJob } from 'cron';
import { BOT_CONFIG, CHECKLIST_TYPES } from "../../constants/bot.js";
import ChecklistSchema from "../../db/Checklist/checklistSchema.js";
import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import TaskStatusType from "../../enum/TaskStatusType.js";

export default (client) => {
    // 🕕 Daily task reminder at 18:00 UTC+7
    new CronJob(
      "0 18 * * *",
      async () => {
        const { start, end } = getTodayRangeUTC(7); // today's range in UTC+7
        const todayChecklists = await ChecklistSchema.find({
          createdAt: { $gte: start, $lte: end },
          type: CHECKLIST_TYPES.DAILY,
        }).populate("items");

        for (const checklist of todayChecklists) {
          // Filter incomplete tasks
          // @ts-ignore
          const pendingTasks = checklist.items.filter(
            (task) => task.status !== TaskStatusType.DONE,
          );

          if (pendingTasks.length === 0) continue; // nothing to remind

          // Format the reminder message
          // @ts-ignore
          const taskList = pendingTasks
            .map((task, idx) => `${idx + 1}. ${task.title}`)
            .join("\n");
          const message = `⏰ <@${checklist.ownerId}> Reminder for your daily checklist:\n${taskList}`;

          try {
            // Fetch the channel from the last message or default daily channel
            const channel = checklist.channelId
              ? await client.channels.cache.get(checklist.channelId)
              : client.channels.cache.get(process.env[BOT_CONFIG.DAILY_CHANNEL_ENV]);

            if (channel) await channel.send(message);
          } catch (err) {
            const errMsg = `❌ Error sending weekly reminder for checklist ${checklist.title}`;
            console.error(errMsg, err);
            const channel = checklist.channelId
              ? await client.channels.fetch(checklist.channelId)
              : client.channels.cache.get(process.env[BOT_CONFIG.DAILY_CHANNEL_ENV]);
            if (channel) await channel.send(message);
          }
        }
      },
      null,
      true,
      BOT_CONFIG.DEFAULT_TIMEZONE,
    );

    // 🕕 Weekly task reminder every day at 18:00 UTC+7
    new CronJob(
      "0 18 * * *",
      async () => {
        console.log("⏰ Running weekly task reminder...");

        // Fetch CURRENT week checklists (Sunday still belongs to current week)
        const { start, end } = getWeekRangeUTC(7, 0);
        const weeklyChecklists = await ChecklistSchema.find({
          createdAt: { $gte: start, $lte: end },
          type: CHECKLIST_TYPES.WEEKLY,
        }).populate("items");

        for (const checklist of weeklyChecklists) {
          // @ts-ignore
          const pendingTasks = checklist.items.filter(
            (task) => task.status !== TaskStatusType.DONE,
          );
          if (pendingTasks.length === 0) continue; // skip if all done

          // @ts-ignore
          const taskList = pendingTasks
            .map((task, idx) => `${idx + 1}. ${task.title}`)
            .join("\n");
          const message = `⏰ <@${checklist.ownerId}> Reminder for your weekly checklist:\n${taskList}`;

          try {
            const channel = checklist.channelId
              ? await client.channels.fetch(checklist.channelId)
              : client.channels.cache.get(process.env[BOT_CONFIG.DAILY_CHANNEL_ENV]);

            if (channel) await channel.send(message);
          } catch (err) {
            const errMsg = `❌ Error sending weekly reminder for checklist ${checklist.title}`;
            console.error(errMsg, err);
            const channel = checklist.channelId
              ? await client.channels.fetch(checklist.channelId)
              : client.channels.cache.get(process.env[BOT_CONFIG.DAILY_CHANNEL_ENV]);
            if (channel) await channel.send(message);
          }
        }
      },
      null,
      true,
      BOT_CONFIG.DEFAULT_TIMEZONE,
    );
}
