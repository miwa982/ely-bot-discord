import { EmbedBuilder } from "discord.js";
import { BOT_CONFIG, DAILY_GAMES } from "../../constants/bot.js";
import DailyCheckinMessageSchema from "../../db/DailyCheckin/dailyCheckinMessageSchema.js";
import DailyCheckinSubscriptionSchema from "../../db/DailyCheckin/dailyCheckinSubscriptionSchema.js";
import { buildCompletionMap } from "../../commands/daily.js";
import { getFormatedTodayDate, getHoyoverseCycleDateKey } from "../../utils/date.js";
import { ALL_GAME_CODES } from "./reminderSettingsPanel.js";

/**
 * Fetches the concluding cycle's daily poll message for a channel
 */
export async function fetchConcludingDailyMessage(channel) {
  // Try previous cycle key first (at 3am, cycle dateKey rolls over)
  const prevDateKey = getHoyoverseCycleDateKey(-1);
  let record = await DailyCheckinMessageSchema.findOne({
    channelId: channel.id,
    dateKey: prevDateKey,
  });

  if (!record) {
    const currentDateKey = getHoyoverseCycleDateKey(0);
    record = await DailyCheckinMessageSchema.findOne({
      channelId: channel.id,
      dateKey: currentDateKey,
    });
  }

  if (!record) {
    const twentyEightHoursAgo = new Date(Date.now() - 28 * 60 * 60 * 1000);
    record = await DailyCheckinMessageSchema.findOne({
      channelId: channel.id,
      updatedAt: { $gte: twentyEightHoursAgo },
    }).sort({ updatedAt: -1 });
  }

  if (!record) return null;

  try {
    const message = await channel.messages.fetch(record.messageId).catch(() => null);
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
  const dailyMessage = customDailyMessage || (await fetchConcludingDailyMessage(channel));
  const dailyEmbed = dailyMessage?.embeds?.[0] ?? null;

  const completionMap = buildCompletionMap(DAILY_GAMES, dailyEmbed);

  // Fetch reminder subscriptions belonging to this guild
  const allSubscriptions = await DailyCheckinSubscriptionSchema.find();
  const guildSubscriptions = allSubscriptions.filter(
    (s) => !s.guildId || s.guildId === guild.id,
  );

  const cycleDateStr = getFormatedTodayDate(-1);

  const recapEmbed = new EmbedBuilder()
    .setAuthor({
      name: "Elysia Daily Check-in Recap",
      iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
    })
    .setTitle(`🌸 Daily Commissions — Final Results (${cycleDateStr})`)
    .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setFooter({
      text: "Hoyoverse Daily Reset (03:00 UTC+7) • New cycle has begun! ♪",
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
        "Hi~ The daily commission window has officially concluded! ✨\n\n" +
          "No reminder subscriptions were configured, but here are the members who completed check-ins:\n\n" +
          participantLines.join("\n") +
          "\n\n*Tip: Use `/checkin-reminder settings` or right-click any member > `Apps > Reminder Settings` to assign daily reminders!*",
      );
    } else {
      recapEmbed.setDescription(
        "Hi~ The daily commission window has officially concluded! ✨\n\n" +
          "No check-ins or reminder subscriptions were recorded for this cycle.\n\n" +
          "💡 *Assign daily reminders using `/checkin-reminder settings` or `Apps > Reminder Settings` so Elysia can keep you and your friends on track!♪*",
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
    "Hi~ Another wonderful day has come to a close! The daily commission cycle has concluded at 03:00 UTC+7. Here is the finalized check-in report for all reminder subscribers♪\n",
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
