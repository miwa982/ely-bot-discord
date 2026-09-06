import { CronJob } from "cron";
import { BOT_CONFIG } from "../../constants/bot.js";
import daily from "../../commands/daily.js";
import { Elysia } from "../../utils/elysia.js";
import { resolveGuildChannel } from "../../utils/guildConfig.js";
import { buildDailyRecapEmbed } from "../../components/DailyCheckin/dailyRecapEmbed.js";

export default (client) => {
  new CronJob(
    "0 3 * * *",
    async () => {
      const guilds = Array.from(client.guilds.cache.values());
      const randomResponse = Elysia.daily_response();

      for (const guild of guilds) {
        try {
          const channel = await resolveGuildChannel(guild, "daily", client);
          if (!channel || !channel.isTextBased()) continue;

          // 1. Send the pretty finalized check-in recap embed for the cycle that just concluded
          try {
            const recapEmbed = await buildDailyRecapEmbed({
              channel,
              guild,
              client,
            });
            if (recapEmbed) {
              await channel.send({ embeds: [recapEmbed] });
            }
          } catch (recapErr) {
            console.error(`Failed to send daily recap for guild ${guild.id}:`, recapErr);
          }

          // 2. Send the new daily poll for the new cycle
          await daily.sendDailyPoll(null, channel, client, randomResponse);
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
