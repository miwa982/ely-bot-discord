import { CronJob } from "cron";
import { BOT_CONFIG, DAILY_GAMES } from "../../constants/bot.js";
import DailyCheckinMessageSchema from "../../db/DailyCheckin/dailyCheckinMessageSchema.js";
import DailyCheckinSubscriptionSchema from "../../db/DailyCheckin/dailyCheckinSubscriptionSchema.js";
import { getUTC7DateKey } from "../../utils/date.js";

const mentionRegex = /<@!?(\d+)>/g;

async function fetchTodayDailyEmbed(channel) {
  const dailyMessageRecord = await DailyCheckinMessageSchema.findOne({
    dateKey: getUTC7DateKey(),
    channelId: channel.id,
  });

  if (!dailyMessageRecord) {
    console.warn(`No stored daily message found for channel ${channel.id} today.`);
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
      const channel = await client.channels.fetch(process.env[BOT_CONFIG.DAILY_CHANNEL_ENV]);
      if (!channel?.isTextBased()) return;

      const subscriptions = await DailyCheckinSubscriptionSchema.find();
      const dailyEmbed = await fetchTodayDailyEmbed(channel);
      if (!dailyEmbed) return;

      for (const subscription of subscriptions) {
        const uncheckedGames = getUncheckedGames(dailyEmbed, subscription.userId);
        if (uncheckedGames.length === 0) continue;

        try {
          await channel.send({
            content: buildReminderMessage(subscription.userId, uncheckedGames),
            allowedMentions: { users: [subscription.userId] },
          });
        } catch (err) {
          console.error(
            `Failed to send daily check-in reminder to ${subscription.userId}:`,
            err,
          );
        }
      }
    },
    null,
    true,
    BOT_CONFIG.DEFAULT_TIMEZONE,
  );
};
