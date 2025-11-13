import { CronJob } from 'cron';
import ChecklistSchema from "../../db/Checklist/checklistSchema.js";
import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import TaskStatusType from "../../enum/TaskStatusType.js";

export default (c, client, handler) => {
    // 🕕 Daily task reminder at 18:00 UTC+7
    new CronJob("0 18 * * *", async () => {
        const { start, end } = getTodayRangeUTC(7); // today's range in UTC+7
        const todayChecklists = await ChecklistSchema.find({
            createdAt: { $gte: start, $lte: end },
            type: "daily"
        }).populate("items");

        for (const checklist of todayChecklists) {
            // Filter incomplete tasks
            const pendingTasks = checklist.items.filter(task => task.status !== TaskStatusType.DONE);

            if (pendingTasks.length === 0) continue; // nothing to remind

            // Format the reminder message
            const taskList = pendingTasks.map((task, idx) => `${idx + 1}. ${task.title}`).join("\n");
            const message = `⏰ <@${checklist.ownerName}> Reminder for your daily checklist:\n${taskList}`;

            try {
                // Fetch the channel from the last message or default daily channel
                const channel = checklist.channelId
                    ? await client.channels.fetch(checklist.channelId)
                    : client.channels.cache.get(process.env.DAILY_CHANNEL_ID);

                if (channel) await channel.send(message);
            } catch (err) {
                console.error(`❌ Error sending reminder for checklist ${checklist.title}:`, err);
            }
        }
    });

    // 🕕 Weekly task reminder at Sunday 18:00 UTC+7
new CronJob("0 18 * * 0", async () => { // Sunday = 0
    console.log("⏰ Running weekly task reminder...");

    // Fetch CURRENT week checklists (Sunday still belongs to current week)
    const { start, end } = getWeekRangeUTC(7, 0);
    const weeklyChecklists = await ChecklistSchema.find({
        createdAt: { $gte: start, $lte: end },
        type: "weekly"
    }).populate("items");

    for (const checklist of weeklyChecklists) {
        const pendingTasks = checklist.items.filter(task => task.status !== TaskStatusType.DONE);
        if (pendingTasks.length === 0) continue; // skip if all done

        const taskList = pendingTasks.map((task, idx) => `${idx + 1}. ${task.title}`).join("\n");
        const message = `⏰ <@${checklist.ownerName}> Reminder for your daily checklist:\n${taskList}`;

        try {
            const channel = checklist.channelId
                ? await client.channels.fetch(checklist.channelId)
                : client.channels.cache.get(process.env.DAILY_CHANNEL_ID);

            if (channel) await channel.send(message);
        } catch (err) {
            console.error(`❌ Error sending weekly reminder for checklist ${checklist.title}:`, err);
        }
    }
});




}