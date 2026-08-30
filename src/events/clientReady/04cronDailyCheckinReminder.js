import { CronJob } from "cron";
import { BOT_CONFIG, DAILY_GAMES } from "../../constants/bot.js";
import DailyCheckinMessageSchema from "../../db/DailyCheckin/dailyCheckinMessageSchema.js";
import DailyCheckinSubscriptionSchema from "../../db/DailyCheckin/dailyCheckinSubscriptionSchema.js";
import { getUTC7DateKey } from "../../utils/date.js";
import { resolveGuildChannel } from "../../utils/guildConfig.js";

const mentionRegex = /<@!?(\d+)>/g;

async function fetchTodayDailyEmbed(channel) {
  const dailyMessageRecord = await DailyCheckinMessageSchema.findOne({
    dateKey: getUTC7DateKey(),
    channelId: channel.id,
  });

  if (!dailyMessageRecord) {
    return null;
  }

  try {
    const message = await channel.messages.fetch(dailyMessageRecord.messageId);
    return message.embeds[0] ?? null;
  } catch (error) {
    console.error(
      `Failed to fetch daily message ${dailyMessageRecord.messageId}:`,
      error,
    );
    return null;
  }
}

function getUncheckedGames(dailyEmbed, userId) {
  if (!dailyEmbed) return DAILY_GAMES;

  return DAILY_GAMES.filter((game) => {
    const field = dailyEmbed.fields.find((item) => item.name.includes(game.label));
    if (!field) return true;

    const checkedUserIds = [...field.value.matchAll(mentionRegex)].map((match) => match[1]);
    return !checkedUserIds.includes(userId);
  });
}

function buildReminderMessage(userId, uncheckedGames) {
  const uncheckedList = uncheckedGames
    .map((game) => `• ${game.label}`)
    .join("\n");

  return [
    `<@${userId}> ⏰ Daily check-in reminder`,
    "You have not checked in for:",
    uncheckedList,
  ].join("\n");
}

export default (client) => {
  new CronJob(
    "0 18 * * *",
    async () => {
      const guilds = Array.from(client.guilds.cache.values());
      const subscriptions = await DailyCheckinSubscriptionSchema.find();
      if (!subscriptions.length) return;

      for (const guild of guilds) {
        try {
          const channel = await resolveGuildChannel(guild, "daily", client);
          if (!channel || !channel.isTextBased()) continue;

          const dailyEmbed = await fetchTodayDailyEmbed(channel);
          if (!dailyEmbed) continue;

          // Find subscriptions that belong to this guild or general subscriptions
          const guildSubscriptions = subscriptions.filter(
            (s) => !s.guildId || s.guildId === guild.id,
          );

          for (const subscription of guildSubscriptions) {
            const uncheckedGames = getUncheckedGames(dailyEmbed, subscription.userId);
            if (uncheckedGames.length === 0) continue;

            try {
              await channel.send({
                content: buildReminderMessage(subscription.userId, uncheckedGames),
                allowedMentions: { users: [subscription.userId] },
              });
            } catch (err) {
              console.error(
                `Failed to send daily check-in reminder to ${subscription.userId} in guild ${guild.id}:`,
                err,
              );
            }
          }
        } catch (err) {
          console.error(`Error running daily check-in reminder for guild ${guild.id}:`, err);
        }
      }
    },
    null,
    true,
    BOT_CONFIG.DEFAULT_TIMEZONE,
  );
};
