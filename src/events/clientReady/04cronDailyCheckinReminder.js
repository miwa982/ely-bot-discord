import { CronJob } from "cron";
import { BOT_CONFIG, DAILY_GAMES } from "../../constants/bot.js";
import DailyCheckinMessageSchema from "../../db/DailyCheckin/dailyCheckinMessageSchema.js";
import DailyCheckinSubscriptionSchema from "../../db/DailyCheckin/dailyCheckinSubscriptionSchema.js";
import { getHoyoverseCycleDateKey } from "../../utils/date.js";
import { resolveGuildChannel } from "../../utils/guildConfig.js";

const mentionRegex = /<@!?(\d+)>/g;

async function fetchTodayDailyEmbed(channel) {
  const dateKey = getHoyoverseCycleDateKey();
  let dailyMessageRecord = await DailyCheckinMessageSchema.findOne({
    dateKey,
    channelId: channel.id,
  });

  if (!dailyMessageRecord) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    dailyMessageRecord = await DailyCheckinMessageSchema.findOne({
      channelId: channel.id,
      updatedAt: { $gte: twentyFourHoursAgo },
    }).sort({ updatedAt: -1 });
  }

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

function getUncheckedGames(dailyEmbed, userId, subscribedGames = null) {
  const gamesToCheck =
    subscribedGames && subscribedGames.length > 0
      ? DAILY_GAMES.filter((g) => subscribedGames.includes(g.code))
      : DAILY_GAMES;

  if (!dailyEmbed) return gamesToCheck;

  return gamesToCheck.filter((game) => {
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
  // Run hourly at minute 0 in UTC+7 to support individual subscriber reminder times
  new CronJob(
    "0 * * * *",
    async () => {
      const currentHour = parseInt(
        new Intl.DateTimeFormat("en-US", {
          timeZone: BOT_CONFIG.DEFAULT_TIMEZONE,
          hour: "numeric",
          hourCycle: "h23",
        }).format(new Date()),
        10,
      );

      const subscriptions = await DailyCheckinSubscriptionSchema.find();
      if (!subscriptions.length) return;

      const guilds = Array.from(client.guilds.cache.values());

      for (const guild of guilds) {
        try {
          // Find subscriptions that belong to this guild and match current hour (default is 18)
          const matchingSubscriptions = subscriptions.filter(
            (s) =>
              (!s.guildId || s.guildId === guild.id) &&
              (s.reminderHour ?? 18) === currentHour,
          );

          if (!matchingSubscriptions.length) continue;

          const channel = await resolveGuildChannel(guild, "daily", client);
          if (!channel || !channel.isTextBased()) continue;

          const dailyEmbed = await fetchTodayDailyEmbed(channel);
          if (!dailyEmbed) continue;

          for (const subscription of matchingSubscriptions) {
            const uncheckedGames = getUncheckedGames(
              dailyEmbed,
              subscription.userId,
              subscription.games,
            );
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
