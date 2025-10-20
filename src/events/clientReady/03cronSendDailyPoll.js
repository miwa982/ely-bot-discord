import { CronJob } from 'cron';
import daily from '../../commands/daily.js';
import { Elysia } from '../../utils/elysia.js';


export default (c, client, handler) => {
    new CronJob("0 3 * * *", async () => {
        const channel = c.channels.cache.get(process.env.DAILY_CHANNEL_ID);
        if (channel) {
            const randomResponse = Elysia.daily_response();
            await channel.send(randomResponse);
            await daily.sendDailyPoll(null, channel, client);
        }
    }, null, true, "Asia/Bangkok");
};