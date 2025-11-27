import { CronJob } from 'cron';
import ChecklistSchema from "../../db/Checklist/checklistSchema.js";
import { getFormatedTodayDate, getFormattedWeekRangeUTC7, getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import TaskStatusType from "../../enum/TaskStatusType.js";
import TaskSchema from "../../db/Checklist/taskSchema.js";
import enumData from '../../enum/enumData.js';

export default async (c, client, handler) => {
    console.log(`checklist scheduler running...`);
    const channel = c.channels.cache.get(process.env.DAILY_CHANNEL_ID);
    // Daily - 23:59 UTC+7
    new CronJob("58 23 * * *", async () => {
        const { start, end } = getTodayRangeUTC(7);
        const todayChecklists = await ChecklistSchema.find({
            createdAt: { $gte: start, $lte: end },
            type: "daily"
        }).populate("items");

        for (const checklist of todayChecklists) {
            try {
                await handleChecklistEndOfPeriod(checklist, "daily");
                await channel.send(`Daily checklist scheduler next day for ${checklist.title}`);
            } catch (err) {
                await channel.send(`❌ Error processing daily checklist ${checklist.title}:`, err);
            }
        }
    }, null, true, "Asia/Bangkok");

    // Weekly - Monday 00:00 UTC+7
    new CronJob("0 0 * * 1", async () => {
        const { start, end } = getWeekRangeUTC(7, -1); // last week's checklists
        const lastWeekChecklists = await ChecklistSchema.find({
            createdAt: { $gte: start, $lte: end },
            type: "weekly"
        }).populate("items");

        for (const checklist of lastWeekChecklists) {
            try {
                await handleChecklistEndOfPeriod(channel, checklist, "weekly");
                await channel.send(`Weekly checklist scheduler next week for ${checklist.title}`);
            } catch (err) {
                await channel.send(`❌ Error processing weekly checklist ${checklist.title}:`, err);
            }
        }
    }, null, true, "Asia/Bangkok");

};

async function handleChecklistEndOfPeriod(channel, checklist, type) {
    const ownerName = checklist.ownerName;

    if (!checklist.isReset) {
        let newTitle;

        if (type === "daily") {
            const tomorrow = new Date(Date.now() + 86400000);
            newTitle = `Checklist (${getFormatedTodayDate(1)})`;
        } else {
            newTitle = `Checklist (${getFormattedWeekRangeUTC7(0)})`;
        }

        // Create empty checklist first (so we can attach tasks)
        const newChecklist = await ChecklistSchema.create({
            title: newTitle,
            type: checklist.type,
            description: checklist.description,
            ownerName: ownerName,
            items: [],
            isReset: checklist.isReset,
            isResetStatus: checklist.isResetStatus,
            lastMessageId: null,
            channelId: null
        });

        const newTasks = await Promise.all(
            checklist.items.map(async (task) => {
                return await TaskSchema.create({
                    checklistId: newChecklist._id,  // attach to new checklist
                    title: task.title,
                    status: checklist.isResetStatus ? enumData.TaskStatusType.TODO.code : task.status
                });
            })
        );
        
        // Attach new tasks to the checklist
        newChecklist.items = newTasks;
        await newChecklist.save();
        
        checklist.isResetStatus ? await channel.send(`🧹 Reset task statuses for ${ownerName}'s ${type} checklist: ${checklist.title}`) : ''
        await channel.send(`📋 Created next ${type} checklist for ${ownerName}: ${newChecklist.title}`);
    }
}