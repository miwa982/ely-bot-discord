import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { BOT_CONFIG, DAILY_GAMES, DISCORD_FLAGS } from "../constants/bot.js";
import DailyCheckinMessageSchema from "../db/DailyCheckin/dailyCheckinMessageSchema.js";
import {
  getFormatedTodayDate,
  getHoyoverseCycleDateKey,
  getUTC7DateKey,
} from "../utils/date.js";
import { Elysia } from "../utils/elysia.js";

const commandInfo = {
  name: "daily",
  description: "Hoyoverse daily commissions checklist",
};

export const DAILY_BUTTON_PREFIX = "daily-toggle";
export const DAILY_USER_TOGGLE_PREFIX = "daily-user-toggle";
const mentionRegex = /<@!?(\d+)>/g;

export const GAME_CHOICES = DAILY_GAMES.map((game) => ({
  name: game.label,
  value: game.code,
}));

export async function getDailyGameOptions(client) {
  const games = DAILY_GAMES;
  const emojis = await Promise.all(
    games.map(async (game) => {
      try {
        return await client.application.emojis.fetch(game.emojiId);
      } catch (err) {
        console.error(`Failed to fetch daily emoji ${game.emojiId}:`, err);
        return null;
      }
    }),
  );

  return games.map((game, index) => ({
    ...game,
    emoji: emojis[index],
  }));
}

function getEmojiMarkup(game) {
  if (!game.emoji) return "";
  return game.emoji.animated
    ? `<a:${game.emoji.name}:${game.emoji.id}>`
    : `<:${game.emoji.name}:${game.emoji.id}>`;
}

export function buildCompletionMap(games, sourceEmbed) {
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

export function buildDailyEmbed(
  games,
  completionMap,
  title = `Daily commission (${getFormatedTodayDate()})`,
) {
  const completedCount = [...completionMap.values()].reduce(
    (total, users) => total + users.length,
    0,
  );
  const activeGames = [...completionMap.values()].filter(
    (users) => users.length > 0,
  ).length;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Ely Daily Check-in",
      iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
    })
    .setTitle(title.replace("Daily commission", "Daily Commission"))
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
    .setDescription([
      "Tap a game button below to check in. Tap again to undo.",
      "",
      `**Progress:** ${completedCount} check-in(s) across ${activeGames}/${games.length} game(s)`,
    ].join("\n"))
    .setFooter({ text: "Daily reset follows UTC+7" })
    .setTimestamp();

  for (const game of games) {
    const users = completionMap.get(game.code) ?? [];
    const emoji = getEmojiMarkup(game);
    embed.addFields({
      name: `${emoji} ${game.label}`.trim(),
      value:
        users.length > 0
          ? `✅ ${users.map((userId) => `<@${userId}>`).join(" ")}`
          : "▫️ No check-ins yet",
      inline: true,
    });
  }

  return embed;
}

export function buildDailyComponents(games, completionMap) {
  const buttons = games.map((game) => {
    const users = completionMap.get(game.code) ?? [];
    const button = new ButtonBuilder()
      .setCustomId(`${DAILY_BUTTON_PREFIX}:${game.code}`)
      .setLabel(String(users.length))
      .setStyle(users.length > 0 ? ButtonStyle.Success : ButtonStyle.Secondary);

    if (game.emoji) {
      button.setEmoji({ id: game.emoji.id, name: game.emoji.name });
    } else {
      button.setLabel(`${game.code.toUpperCase()} ${users.length}`);
    }

    return button;
  });

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }
  return rows;
}

export function buildUserPickerComponents(games, completionMap, targetUserId) {
  const buttons = games.map((game) => {
    const users = completionMap.get(game.code) ?? [];
    const isChecked = users.includes(targetUserId);
    const button = new ButtonBuilder()
      .setCustomId(`${DAILY_USER_TOGGLE_PREFIX}:${targetUserId}:${game.code}`)
      .setLabel(game.label)
      .setStyle(isChecked ? ButtonStyle.Success : ButtonStyle.Secondary);

    if (game.emoji) {
      button.setEmoji({ id: game.emoji.id, name: game.emoji.name });
    }

    return button;
  });

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }
  return rows;
}

async function persistDailyMessage(message) {
  if (!message?.id || !message.channelId) return message;

  try {
    await DailyCheckinMessageSchema.findOneAndUpdate(
      { dateKey: getHoyoverseCycleDateKey(), channelId: message.channelId },
      {
        messageId: message.id,
        guildId: message.guildId ?? null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    console.error(`Failed to save daily message ${message.id}:`, error);
  }

  return message;
}

export async function getTodayDailyMessage(client, channelId = null, guildId = null) {
  const dateKey = getHoyoverseCycleDateKey();

  let record = null;
  if (channelId) {
    record = await DailyCheckinMessageSchema.findOne({ dateKey, channelId });
  }
  if (!record && guildId) {
    record = await DailyCheckinMessageSchema.findOne({ dateKey, guildId });
  }
  if (!record) {
    const legacyEnvId = process.env[BOT_CONFIG.DAILY_CHANNEL_ENV];
    if (legacyEnvId) {
      record = await DailyCheckinMessageSchema.findOne({ dateKey, channelId: legacyEnvId });
    }
  }
  if (!record) {
    record = await DailyCheckinMessageSchema.findOne({ dateKey }).sort({ updatedAt: -1 });
  }

  // 24-hour fallback: If no record found for the calculated cycle key, fallback to the latest message within 24h
  if (!record) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (channelId) {
      record = await DailyCheckinMessageSchema.findOne({
        channelId,
        updatedAt: { $gte: twentyFourHoursAgo },
      }).sort({ updatedAt: -1 });
    }
    if (!record && guildId) {
      record = await DailyCheckinMessageSchema.findOne({
        guildId,
        updatedAt: { $gte: twentyFourHoursAgo },
      }).sort({ updatedAt: -1 });
    }
    if (!record) {
      record = await DailyCheckinMessageSchema.findOne({
        updatedAt: { $gte: twentyFourHoursAgo },
      }).sort({ updatedAt: -1 });
    }
  }

  if (!record) return null;

  try {
    const channel = await client.channels.fetch(record.channelId).catch(() => null);
    if (!channel) return null;
    const message = await channel.messages.fetch(record.messageId).catch(() => null);
    return message;
  } catch (err) {
    console.error(`Failed to fetch today's daily message ${record?.messageId}:`, err);
    return null;
  }
}


export async function modifyUserCheckin({
  client,
  targetUserId,
  gameCode,
  action = "toggle",
  channelId = null,
  guildId = null,
}) {
  const message = await getTodayDailyMessage(client, channelId, guildId);
  if (!message) {
    return {
      success: false,
      error: "No active daily check-in message found for today. Use `/daily send` first.",
    };
  }

  const currentEmbed = message.embeds[0];
  if (!currentEmbed) {
    return {
      success: false,
      error: "Could not read the daily check-in embed structure.",
    };
  }

  const games = await getDailyGameOptions(client);
  const game = games.find((g) => g.code === gameCode);
  if (!game) {
    return { success: false, error: `Invalid game code: ${gameCode}` };
  }

  const completionMap = buildCompletionMap(games, currentEmbed);
  const completedUsers = completionMap.get(gameCode) || [];

  let isChecked = false;
  if (action === "check") {
    if (!completedUsers.includes(targetUserId)) {
      completionMap.set(gameCode, [...completedUsers, targetUserId]);
    }
    isChecked = true;
  } else if (action === "uncheck") {
    completionMap.set(
      gameCode,
      completedUsers.filter((id) => id !== targetUserId),
    );
    isChecked = false;
  } else {
    // toggle
    if (completedUsers.includes(targetUserId)) {
      completionMap.set(
        gameCode,
        completedUsers.filter((id) => id !== targetUserId),
      );
      isChecked = false;
    } else {
      completionMap.set(gameCode, [...completedUsers, targetUserId]);
      isChecked = true;
    }
  }

  await message.edit({
    embeds: [buildDailyEmbed(games, completionMap, currentEmbed.title)],
    components: buildDailyComponents(games, completionMap),
  });

  return {
    success: true,
    isChecked,
    game,
    games,
    completionMap,
    message,
  };
}

async function sendDailyPoll(interaction, channel, client, content = null) {
  if (interaction && !interaction.deferred && !interaction.replied) {
    await interaction.deferReply();
  }

  const games = await getDailyGameOptions(client);
  const completionMap = buildCompletionMap(games);
  const payload = {
    content,
    embeds: [buildDailyEmbed(games, completionMap)],
    components: buildDailyComponents(games, completionMap),
  };

  if (!payload.content) delete payload.content;

  if (interaction) {
    const message = await interaction.editReply(payload);
    return persistDailyMessage(message);
  }

  if (!channel) return;
  const message = await channel.send(payload);
  return persistDailyMessage(message);
}

async function handleDailyButton(interaction, client) {
  if (!interaction.isButton()) return false;

  // 1. Handle main poll toggle button
  if (interaction.customId.startsWith(`${DAILY_BUTTON_PREFIX}:`)) {
    const selectedGameCode = interaction.customId.split(":")[1];
    const currentEmbed = interaction.message.embeds[0];
    const games = await getDailyGameOptions(client);
    const completionMap = buildCompletionMap(games, currentEmbed);
    const completedUsers = completionMap.get(selectedGameCode);

    if (!completedUsers) {
      await interaction.reply({
        content: "❌ Daily option not found.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
      return true;
    }

    const userId = interaction.user.id;
    if (completedUsers.includes(userId)) {
      completionMap.set(
        selectedGameCode,
        completedUsers.filter((completedUserId) => completedUserId !== userId),
      );
    } else {
      completionMap.set(selectedGameCode, [...completedUsers, userId]);
    }

    await interaction.update({
      embeds: [buildDailyEmbed(games, completionMap, currentEmbed?.title)],
      components: buildDailyComponents(games, completionMap),
    });

    return true;
  }

  // 2. Handle user picker toggle button (from context menu or assign menu)
  if (interaction.customId.startsWith(`${DAILY_USER_TOGGLE_PREFIX}:`)) {
    const [, targetUserId, selectedGameCode] = interaction.customId.split(":");
    const result = await modifyUserCheckin({
      client,
      targetUserId,
      gameCode: selectedGameCode,
      action: "toggle",
      channelId: interaction.channelId,
      guildId: interaction.guildId,
    });

    if (!result.success) {
      await interaction.reply({
        content: `❌ ${result.error}`,
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
      return true;
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Elysia Check-in Manager",
        iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
      })
      .setTitle(`Daily Check-in for user`)
      .setDescription(
        `Click a button to toggle check-in for <@${targetUserId}> on today's daily checklist.\n\n` +
          `**Latest Update:** ${result.isChecked ? "✅ Checked in" : "▫️ Unchecked"} for **${result.game.label}**`,
      )
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setTimestamp();

    await interaction.update({
      embeds: [embed],
      components: buildUserPickerComponents(
        result.games,
        result.completionMap,
        targetUserId,
      ),
    });

    return true;
  }

  return false;
}

export default {
  data: new SlashCommandBuilder()
    .setName(commandInfo.name)
    .setDescription(commandInfo.description)
    .addSubcommand((sub) =>
      sub
        .setName("send")
        .setDescription("Post today's daily commission checklist poll"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("check")
        .setDescription("Check in a member (or yourself) for a specific game")
        .addStringOption((opt) =>
          opt
            .setName("game")
            .setDescription("The game to check in")
            .setRequired(true)
            .addChoices(...GAME_CHOICES),
        )
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Member to check in (Defaults to yourself)")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("uncheck")
        .setDescription("Remove check-in for a member (or yourself) on a specific game")
        .addStringOption((opt) =>
          opt
            .setName("game")
            .setDescription("The game to uncheck")
            .setRequired(true)
            .addChoices(...GAME_CHOICES),
        )
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Member to uncheck (Defaults to yourself)")
            .setRequired(false),
        ),
    ),

  run: async ({ interaction, client }) => {
    let subcommand = null;
    try {
      subcommand = interaction.options.getSubcommand();
    } catch {
      subcommand = "send";
    }

    if (subcommand === "send") {
      const randomResponse = Elysia.daily_response();
      return sendDailyPoll(interaction, null, client, randomResponse);
    }

    if (subcommand === "check" || subcommand === "uncheck") {
      const gameCode = interaction.options.getString("game");
      const targetUser = interaction.options.getUser("user") || interaction.user;

      await interaction.deferReply({ flags: DISCORD_FLAGS.EPHEMERAL });

      const result = await modifyUserCheckin({
        client,
        targetUserId: targetUser.id,
        gameCode,
        action: subcommand,
        channelId: interaction.channelId,
        guildId: interaction.guildId,
      });

      if (!result.success) {
        return interaction.editReply({
          content: `❌ ${result.error}`,
        });
      }

      const statusText =
        subcommand === "check"
          ? `✅ Checked in <@${targetUser.id}> for **${result.game.label}**!`
          : `✅ Removed check-in for <@${targetUser.id}> on **${result.game.label}**.`;

      return interaction.editReply({
        content: statusText,
      });
    }
  },

  options: {},
  sendDailyPoll,
  handleDailyButton,
  modifyUserCheckin,
  getTodayDailyMessage,
};
