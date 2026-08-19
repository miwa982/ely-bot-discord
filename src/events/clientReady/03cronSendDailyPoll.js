import { CronJob } from 'cron';
import { BOT_CONFIG } from '../../constants/bot.js';
import daily from '../../commands/daily.js';
import { Elysia } from '../../utils/elysia.js';


export default (client) => {
    new CronJob("0 3 * * *", async () => {
        const channel = client.channels.cache.get(process.env[BOT_CONFIG.DAILY_CHANNEL_ENV]);
        if (channel) {
            const randomResponse = Elysia.daily_response();
            await daily.sendDailyPoll(null, channel, client, randomResponse);
        }
    }, null, true, BOT_CONFIG.DEFAULT_TIMEZONE);
};
