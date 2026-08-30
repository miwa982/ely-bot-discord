import { CronJob } from "cron";
import { BOT_CONFIG } from "../../constants/bot.js";
import daily from "../../commands/daily.js";
import { Elysia } from "../../utils/elysia.js";
import { resolveGuildChannel } from "../../utils/guildConfig.js";

export default (client) => {
  new CronJob(
    "0 3 * * *",
    async () => {
      const guilds = Array.from(client.guilds.cache.values());
      const randomResponse = Elysia.daily_response();

      for (const guild of guilds) {
        try {
          const channel = await resolveGuildChannel(guild, "daily", client);
          if (channel && channel.isTextBased()) {
            await daily.sendDailyPoll(null, channel, client, randomResponse);
          }
        } catch (err) {
          console.error(`Failed to send daily poll for guild ${guild.id}:`, err);
        }
      }
    },
    null,
    true,
    BOT_CONFIG.DEFAULT_TIMEZONE,
  );
};
