import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { BOT_CONFIG, DAILY_GAMES, DISCORD_FLAGS } from "../../constants/bot.js";
import DailyCheckinSubscriptionSchema from "../../db/DailyCheckin/dailyCheckinSubscriptionSchema.js";

export const ALL_GAME_CODES = DAILY_GAMES.map((g) => g.code);

/**
 * Builds the interactive reminder settings embed and components for a user
 */
export async function buildReminderSettingsPanel(targetUser, client, executorUser = null) {
  const subscription = await DailyCheckinSubscriptionSchema.findOne({
    userId: targetUser.id,
  });

  const isSubscribed = Boolean(subscription);
  const activeGames = subscription?.games?.length
    ? subscription.games
    : ALL_GAME_CODES;
  const reminderHour = subscription?.reminderHour ?? 18;
  const timeFormatted = `${String(reminderHour).padStart(2, "0")}:00 UTC+7`;

  const gameListStatus = DAILY_GAMES.map((game) => {
    const isChecked = isSubscribed && activeGames.includes(game.code);
    const mark = isChecked ? "✅" : "▫️";
    return `${mark} **${game.label}**`;
  }).join("\n");

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Elysia Check-in Manager",
      iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
    })
    .setTitle(`⏰ Daily Check-in Reminder Settings: ${targetUser.username}`)
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setDescription(
      (isSubscribed
        ? `🟢 **Status:** Active — Will ping at **${timeFormatted}** in daily channel.`
        : "⚪ **Status:** Inactive — Not currently subscribed.") +
        (subscription?.subscribedBy && subscription.subscribedBy !== targetUser.id
          ? `\n👤 **Configured by:** <@${subscription.subscribedBy}>`
          : "") +
        "\n\n" +
        `⏰ **Configured Reminder Time:** **${timeFormatted}**\n` +
        `🎮 **Registered Games (${isSubscribed ? activeGames.length : 0}/${DAILY_GAMES.length}):**\n` +
        gameListStatus +
        "\n\n" +
        "*Use the dropdowns below to select which games will trigger a reminder and your preferred ping time.*",
    )
    .setFooter({ text: `Reminders only trigger if registered games are unchecked by ${timeFormatted}` })
    .setTimestamp();

  // 1. Multi-select dropdown for game selection
  const selectGameOptions = DAILY_GAMES.map((game) => {
    const opt = new StringSelectMenuOptionBuilder()
      .setLabel(game.label)
      .setValue(game.code)
      .setDescription(`Receive reminder for ${game.label}`)
      .setDefault(isSubscribed && activeGames.includes(game.code));

    if (game.emojiId) {
      opt.setEmoji({ id: game.emojiId });
    }
    return opt;
  });

  const gameSelectMenu = new StringSelectMenuBuilder()
    .setCustomId(`reminder-select-games:${targetUser.id}`)
    .setPlaceholder("Select games to receive reminders for")
    .setMinValues(1)
    .setMaxValues(DAILY_GAMES.length)
    .addOptions(selectGameOptions);

  // 2. Select menu for reminder hour (0 to 23 in UTC+7)
  const timeOptions = Array.from({ length: 24 }, (_, h) => {
    const padded = String(h).padStart(2, "0");
    const isDefault = h === 18;
    return new StringSelectMenuOptionBuilder()
      .setLabel(`${padded}:00 UTC+7${isDefault ? " (Default)" : ""}`)
      .setValue(String(h))
      .setDescription(`Send daily reminder at ${padded}:00 UTC+7`)
      .setDefault(isSubscribed && reminderHour === h);
  });

  const timeSelectMenu = new StringSelectMenuBuilder()
    .setCustomId(`reminder-select-time:${targetUser.id}`)
    .setPlaceholder(`Reminder Time: ${timeFormatted}`)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(timeOptions);

  // 3. Action Buttons
  const toggleSubBtn = new ButtonBuilder()
    .setCustomId(`reminder-btn-toggle-sub:${targetUser.id}`)
    .setLabel(isSubscribed ? "Turn Reminders Off" : `Turn Reminders On (${timeFormatted})`)
    .setEmoji(isSubscribed ? "🔕" : "🔔")
    .setStyle(isSubscribed ? ButtonStyle.Danger : ButtonStyle.Success);

  const selectAllBtn = new ButtonBuilder()
    .setCustomId(`reminder-btn-all-games:${targetUser.id}`)
    .setLabel("Select All Games")
    .setEmoji("🌟")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId(`reminder-btn-refresh:${targetUser.id}`)
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder().addComponents(gameSelectMenu);
  const row2 = new ActionRowBuilder().addComponents(timeSelectMenu);
  const row3 = new ActionRowBuilder().addComponents(
    toggleSubBtn,
    selectAllBtn,
    refreshBtn,
  );

  return {
    embeds: [embed],
    components: [row1, row2, row3],
  };
}

/**
 * Handles button and select menu interactions for reminder settings
 */
export async function handleReminderSettingsInteraction(interaction, client) {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
    return false;
  }

  // 1. Handle Game Multi-Select Menu
  if (interaction.customId.startsWith("reminder-select-games:")) {
    const targetUserId = interaction.customId.split(":")[1];
    const selectedGames = interaction.values;
    const targetUser = await client.users.fetch(targetUserId).catch(() => null);

    if (!targetUser) {
      await interaction.reply({
        content: "❌ User not found.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
      return true;
    }

    await DailyCheckinSubscriptionSchema.findOneAndUpdate(
      { userId: targetUserId },
      {
        userId: targetUserId,
        userTag: targetUser.tag,
        guildId: interaction.guildId,
        games: selectedGames,
        subscribedBy: interaction.user.id,
        subscribedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const panel = await buildReminderSettingsPanel(targetUser, client, interaction.user);
    await interaction.update({
      embeds: panel.embeds,
      components: panel.components,
    });
    return true;
  }

  // 2. Handle Reminder Time Select Menu
  if (interaction.customId.startsWith("reminder-select-time:")) {
    const targetUserId = interaction.customId.split(":")[1];
    const selectedHour = parseInt(interaction.values[0], 10);
    const targetUser = await client.users.fetch(targetUserId).catch(() => null);

    if (!targetUser) {
      await interaction.reply({
        content: "❌ User not found.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
      return true;
    }

    await DailyCheckinSubscriptionSchema.findOneAndUpdate(
      { userId: targetUserId },
      {
        userId: targetUserId,
        userTag: targetUser.tag,
        guildId: interaction.guildId,
        reminderHour: selectedHour,
        subscribedBy: interaction.user.id,
        subscribedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const panel = await buildReminderSettingsPanel(targetUser, client, interaction.user);
    await interaction.update({
      embeds: panel.embeds,
      components: panel.components,
    });
    return true;
  }

  // 3. Handle Action Buttons
  if (interaction.customId.startsWith("reminder-btn-toggle-sub:")) {
    const targetUserId = interaction.customId.split(":")[1];
    const targetUser = await client.users.fetch(targetUserId).catch(() => null);

    if (!targetUser) {
      await interaction.reply({
        content: "❌ User not found.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
      return true;
    }

    const existing = await DailyCheckinSubscriptionSchema.findOne({
      userId: targetUserId,
    });

    if (existing) {
      await DailyCheckinSubscriptionSchema.deleteOne({ userId: targetUserId });
    } else {
      await DailyCheckinSubscriptionSchema.create({
        userId: targetUserId,
        userTag: targetUser.tag,
        guildId: interaction.guildId,
        games: ALL_GAME_CODES,
        reminderHour: 18,
        subscribedBy: interaction.user.id,
        subscribedAt: new Date(),
      });
    }

    const panel = await buildReminderSettingsPanel(targetUser, client, interaction.user);
    await interaction.update({
      embeds: panel.embeds,
      components: panel.components,
    });
    return true;
  }

  if (interaction.customId.startsWith("reminder-btn-all-games:")) {
    const targetUserId = interaction.customId.split(":")[1];
    const targetUser = await client.users.fetch(targetUserId).catch(() => null);

    if (!targetUser) {
      await interaction.reply({
        content: "❌ User not found.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
      return true;
    }

    await DailyCheckinSubscriptionSchema.findOneAndUpdate(
      { userId: targetUserId },
      {
        userId: targetUserId,
        userTag: targetUser.tag,
        guildId: interaction.guildId,
        games: ALL_GAME_CODES,
        subscribedBy: interaction.user.id,
        subscribedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const panel = await buildReminderSettingsPanel(targetUser, client, interaction.user);
    await interaction.update({
      embeds: panel.embeds,
      components: panel.components,
    });
    return true;
  }

  if (interaction.customId.startsWith("reminder-btn-refresh:")) {
    const targetUserId = interaction.customId.split(":")[1];
    const targetUser = await client.users.fetch(targetUserId).catch(() => null);

    if (!targetUser) {
      await interaction.reply({
        content: "❌ User not found.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
      return true;
    }

    const panel = await buildReminderSettingsPanel(targetUser, client, interaction.user);
    await interaction.update({
      embeds: panel.embeds,
      components: panel.components,
    });
    return true;
  }

  return false;
}
