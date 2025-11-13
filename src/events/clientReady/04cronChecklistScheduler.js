import { CronJob } from 'cron';
import ChecklistSchema from "../../db/Checklist/checklistSchema.js";
import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import TaskStatusType from "../../enum/TaskStatusType.js";


export default (c, client, handler) => {
    const channel = c.channels.cache.get(process.env.DAILY_CHANNEL_ID);
    // Daily - 23:59 UTC+7
    new CronJob("59 23 * * *", async () => {
        const { start, end } = getTodayRangeUTC(7);
        const todayChecklists = await ChecklistSchema.find({
            createdAt: { $gte: start, $lte: end },
            type: "daily"
        }).populate("items");

        for (const checklist of todayChecklists) {
            try {
                await handleChecklistEndOfPeriod(checklist, "daily");
            } catch (err) {
                console.error(`❌ Error processing daily checklist ${checklist.title}:`, err);
            }
        }
    });

    // Weekly - Monday 00:00 UTC+7
    new CronJob("0 0 * * 1", async () => {
        const { start, end } = getWeekRangeUTC(7, -1); // last week's checklists
        const lastWeekChecklists = await ChecklistSchema.find({
            createdAt: { $gte: start, $lte: end },
            type: "weekly"
        }).populate("items");

        for (const checklist of lastWeekChecklists) {
            try {
                await handleChecklistEndOfPeriod(checklist, "weekly");
            } catch (err) {
                console.error(`❌ Error processing weekly checklist ${checklist.title}:`, err);
            }
        }
    });

};

/**
 * Resets task statuses or creates next period checklist as needed
 * @param {Checklist} checklist 
 * @param {"daily"|"weekly"} type 
 */
async function handleChecklistEndOfPeriod(checklist, type) {
    const ownerName = checklist.ownerName;

    // 🔄 Reset task statuses if isResetStatus is true
    if (checklist.isResetStatus) {
        for (const task of checklist.items) {
            task.status = TaskStatusType.TODO;
            await task.save();
        }
        console.log(`✅ Reset task statuses for ${ownerName}'s ${type} checklist: ${checklist.title}`);
    }

    // 🆕 Create next day/week checklist if isReset is false
    if (!checklist.isReset) {
        let newTitle;

        if (type === "daily") {
            // Next day
            const tomorrow = new Date(Date.now() + 86400000);
            newTitle = `Checklist (${getFormatedTodayDate(tomorrow)})`;
        } else {
            // Weekly - use the CURRENT week range at Monday 00:00
            newTitle = `Checklist (${getFormattedWeekRangeUTC7(0)})`;
        }

        const newChecklist = await ChecklistSchema.create({
            title: newTitle,
            type: checklist.type,
            description: checklist.description,
            ownerName: ownerName,
            items: checklist.items.map(task => ({
                title: task.title,
                status: TaskStatusType.TODO
            })),
            isReset: checklist.isReset,
            isResetStatus: checklist.isResetStatus
        });

        console.log(`📋 Created next ${type} checklist for ${ownerName}: ${newChecklist.title}`);
    }
}