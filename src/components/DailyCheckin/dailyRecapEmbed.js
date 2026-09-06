import { EmbedBuilder } from "discord.js";
import { BOT_CONFIG, DAILY_GAMES } from "../../constants/bot.js";
import DailyCheckinMessageSchema from "../../db/DailyCheckin/dailyCheckinMessageSchema.js";
import DailyCheckinSubscriptionSchema from "../../db/DailyCheckin/dailyCheckinSubscriptionSchema.js";
import { getFormatedTodayDate, getHoyoverseCycleDateKey } from "../../utils/date.js";
import { resolveGuildChannel } from "../../utils/guildConfig.js";
import { ALL_GAME_CODES } from "./reminderSettingsPanel.js";

const mentionRegex = /<@!?(\d+)>/g;

/**
 * Parses user check-ins from a daily poll embed
 */
function extractCompletionMap(games, sourceEmbed) {
  const completionMap = new Map(games.map((game) => [game.code, []]));
  if (!sourceEmbed?.fields) return completionMap;

  for (const game of games) {
    const field = sourceEmbed.fields.find((item) => item.name.includes(game.label));
    if (!field) continue;

    const userIds = [...field.value.matchAll(mentionRegex)].map((match) => match[1]);
    completionMap.set(game.code, [...new Set(userIds)]);
  }

  return completionMap;
}

/**
 * Fetches the concluding or active cycle's daily poll message for a channel/guild
 */
export async function fetchConcludingDailyMessage({ channel = null, guild = null, client = null }) {
  const guildId = guild?.id ?? channel?.guildId ?? null;
  const channelId = channel?.id ?? null;

  // 1. Resolve the designated daily channel for this guild
  let dailyChannel = null;
  if (guild && client) {
    try {
      dailyChannel = await resolveGuildChannel(guild, "daily", client);
    } catch {
      dailyChannel = null;
    }
  }
  const targetChannelId = dailyChannel?.id ?? channelId;

  // 2. Search for the daily poll message record
  const currentDateKey = getHoyoverseCycleDateKey(0);
  const prevDateKey = getHoyoverseCycleDateKey(-1);

  let record = null;
  // Try current cycle first, then previous cycle
  for (const dateKey of [currentDateKey, prevDateKey]) {
    if (targetChannelId) {
      record = await DailyCheckinMessageSchema.findOne({ channelId: targetChannelId, dateKey });
    }
    if (!record && channelId) {
      record = await DailyCheckinMessageSchema.findOne({ channelId, dateKey });
    }
    if (!record && guildId) {
      record = await DailyCheckinMessageSchema.findOne({ guildId, dateKey });
    }
    if (record) break;
  }

  // 3. Fallback to latest message within last 36 hours
  if (!record) {
    const thirtySixHoursAgo = new Date(Date.now() - 36 * 60 * 60 * 1000);
    if (targetChannelId) {
      record = await DailyCheckinMessageSchema.findOne({
        channelId: targetChannelId,
        updatedAt: { $gte: thirtySixHoursAgo },
      }).sort({ updatedAt: -1 });
    }
    if (!record && channelId) {
      record = await DailyCheckinMessageSchema.findOne({
        channelId,
        updatedAt: { $gte: thirtySixHoursAgo },
      }).sort({ updatedAt: -1 });
    }
    if (!record && guildId) {
      record = await DailyCheckinMessageSchema.findOne({
        guildId,
        updatedAt: { $gte: thirtySixHoursAgo },
      }).sort({ updatedAt: -1 });
    }
  }

  if (!record) return null;

  // 4. Fetch the message from the channel where it was actually posted
  try {
    const messageChannel = client
      ? await client.channels.fetch(record.channelId).catch(() => null)
      : channel;

    if (!messageChannel || !messageChannel.isTextBased()) return null;

    const message = await messageChannel.messages.fetch(record.messageId).catch(() => null);
    return message;
  } catch (err) {
    console.error(`Failed to fetch daily poll message ${record.messageId} for recap:`, err);
    return null;
  }
}

/**
 * Builds the pretty finalized check-in recap embed for everyone assigned a reminder
 */
export async function buildDailyRecapEmbed({ channel, guild, client, customDailyMessage = null }) {
  const dailyMessage =
    customDailyMessage || (await fetchConcludingDailyMessage({ channel, guild, client }));
  const dailyEmbed = dailyMessage?.embeds?.[0] ?? null;

  const completionMap = extractCompletionMap(DAILY_GAMES, dailyEmbed);

  // Fetch reminder subscriptions belonging to this guild
  const allSubscriptions = await DailyCheckinSubscriptionSchema.find();
  const guildSubscriptions = allSubscriptions.filter(
    (s) => !s.guildId || s.guildId === guild?.id,
  );

  const cycleDateStr = getFormatedTodayDate(0);

  const recapEmbed = new EmbedBuilder()
    .setAuthor({
      name: "Elysia Daily Check-in Recap",
      iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
    })
    .setTitle(`🌸 Daily Commissions — Final Results (${cycleDateStr})`)
    .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setFooter({
      text: "Hoyoverse Daily Reset (03:00 UTC+7) • New cycle begins at reset! ♪",
    })
    .setTimestamp();

  if (guildSubscriptions.length === 0) {
    // Check if any non-subscribers checked in
    const allCheckedUserIds = [
      ...new Set([...completionMap.values()].flat()),
    ];

    if (allCheckedUserIds.length > 0) {
      const participantLines = allCheckedUserIds.map((userId) => {
        const checkedGames = DAILY_GAMES.filter((g) =>
          completionMap.get(g.code)?.includes(userId),
        );
        return `• <@${userId}> — **${checkedGames.length}/${DAILY_GAMES.length} games**: ${checkedGames.map((g) => g.label).join(", ")}`;
      });

      recapEmbed.setDescription(
        "Hi~ The daily commission window report is ready! ✨\n\n" +
          "No reminder subscriptions are currently registered for this server, but here are the members who completed check-ins on today's poll:\n\n" +
          participantLines.join("\n") +
          "\n\n*Tip: Use `/checkin-reminder settings` or right-click any member > `Apps > Reminder Settings` to assign daily reminders!*",
      );
    } else {
      recapEmbed.setDescription(
        "Hi~ The daily commission window report is ready! ✨\n\n" +
          (dailyEmbed
            ? "No check-ins or reminder subscriptions were recorded on today's poll yet.\n\n"
            : "No active daily commission poll was found for today. Use `/daily send` to start today's checklist!\n\n") +
          "💡 *Assign daily reminders using `/checkin-reminder settings` or `Apps > Reminder Settings` so Elysia can keep everyone on track!♪*",
      );
    }

    return recapEmbed;
  }

  // Process each subscriber's results
  let allClearCount = 0;
  const subscriberResultLines = [];
  const subscriberUserIds = new Set(guildSubscriptions.map((s) => s.userId));

  for (const sub of guildSubscriptions) {
    const targetCodes = sub.games?.length ? sub.games : ALL_GAME_CODES;
    const registeredGames = DAILY_GAMES.filter((g) => targetCodes.includes(g.code));
    const completedGames = registeredGames.filter((g) =>
      completionMap.get(g.code)?.includes(sub.userId),
    );
    const missedGames = registeredGames.filter(
      (g) => !completionMap.get(g.code)?.includes(sub.userId),
    );

    const isAllClear =
      registeredGames.length > 0 && completedGames.length === registeredGames.length;
    if (isAllClear) allClearCount++;

    let line = "";
    if (isAllClear) {
      line =
        `🌟 <@${sub.userId}> — **All Clear!** (${completedGames.length}/${registeredGames.length})\n` +
        `↳ ✨ *Completed: ${completedGames.map((g) => g.label).join(", ")}*`;
    } else if (completedGames.length > 0) {
      line =
        `⚠️ <@${sub.userId}> — **${completedGames.length}/${registeredGames.length} Completed**\n` +
        `↳ ✅ *Done: ${completedGames.map((g) => g.label).join(", ")}*\n` +
        `↳ ❌ *Missed: ${missedGames.map((g) => g.label).join(", ")}*`;
    } else {
      line =
        `💤 <@${sub.userId}> — **0/${registeredGames.length} Completed**\n` +
        `↳ ❌ *Missed: ${missedGames.map((g) => g.label).join(", ")}*`;
    }

    subscriberResultLines.push(line);
  }

  // Also check if any non-subscribed members checked in
  const nonSubscribedCheckins = [];
  for (const [gameCode, userIds] of completionMap.entries()) {
    for (const uId of userIds) {
      if (!subscriberUserIds.has(uId)) {
        nonSubscribedCheckins.push({ userId: uId, gameCode });
      }
    }
  }

  const otherParticipantsMap = new Map();
  for (const item of nonSubscribedCheckins) {
    if (!otherParticipantsMap.has(item.userId)) {
      otherParticipantsMap.set(item.userId, []);
    }
    otherParticipantsMap.get(item.userId).push(item.gameCode);
  }

  const clearRatePercent = Math.round(
    (allClearCount / guildSubscriptions.length) * 100,
  );

  const totalCheckinCount = [...completionMap.values()].reduce(
    (acc, users) => acc + users.length,
    0,
  );

  const descriptionParts = [
    "Hi~ Here is the finalized check-in report for everyone with an assigned reminder!♪\n",
    "📋 **Assigned Reminder Results:**",
    ...subscriberResultLines,
  ];

  if (otherParticipantsMap.size > 0) {
    const otherLines = [...otherParticipantsMap.entries()].map(([uId, codes]) => {
      const names = DAILY_GAMES.filter((g) => codes.includes(g.code))
        .map((g) => g.label)
        .join(", ");
      return `• <@${uId}> — **${codes.length} game(s):** ${names}`;
    });
    descriptionParts.push("\n👥 **Other Participants:**", ...otherLines);
  }

  descriptionParts.push(
    "\n━━━━━━━━━━━━━━━━━━━━",
    `📊 **Cycle Overview:** **${allClearCount}/${guildSubscriptions.length}** subscribers achieved All Clear (**${clearRatePercent}%**)! Total check-ins logged: **${totalCheckinCount}**`,
  );

  recapEmbed.setDescription(descriptionParts.join("\n"));

  return recapEmbed;
}
