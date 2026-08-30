import { ChannelType, PermissionFlagsBits } from "discord.js";
import { BOT_CONFIG } from "../constants/bot.js";
import GuildConfigSchema from "../db/GuildConfig/guildConfigSchema.js";

/**
 * Fetch or create guild configuration
 */
export async function getGuildConfig(guildId) {
  if (!guildId) return null;
  let config = await GuildConfigSchema.findOne({ guildId });
  if (!config) {
    config = await GuildConfigSchema.create({ guildId });
  }
  return config;
}

/**
 * Set a specific channel or all channels for a guild
 */
export async function setGuildChannel(guildId, channelType, channelId) {
  if (!guildId) return null;

  const update = {};
  if (channelType === "all") {
    update.dailyChannelId = channelId;
    update.birthdayChannelId = channelId;
    update.eventChannelId = channelId;
    update.checklistChannelId = channelId;
  } else if (channelType === "daily") {
    update.dailyChannelId = channelId;
  } else if (channelType === "birthday") {
    update.birthdayChannelId = channelId;
  } else if (channelType === "event") {
    update.eventChannelId = channelId;
  } else if (channelType === "checklist") {
    update.checklistChannelId = channelId;
  }

  return GuildConfigSchema.findOneAndUpdate(
    { guildId },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

/**
 * Reset channels for a guild
 */
export async function resetGuildChannel(guildId, channelType = "all") {
  if (!guildId) return null;

  const update = {};
  if (channelType === "all") {
    update.dailyChannelId = null;
    update.birthdayChannelId = null;
    update.eventChannelId = null;
    update.checklistChannelId = null;
  } else if (channelType === "daily") {
    update.dailyChannelId = null;
  } else if (channelType === "birthday") {
    update.birthdayChannelId = null;
  } else if (channelType === "event") {
    update.eventChannelId = null;
  } else if (channelType === "checklist") {
    update.checklistChannelId = null;
  }

  return GuildConfigSchema.findOneAndUpdate(
    { guildId },
    { $set: update },
    { new: true },
  );
}

/**
 * Dynamically resolves the best channel to send messages for a given guild and notification type
 */
export async function resolveGuildChannel(guild, channelType = "daily", client = null) {
  if (!guild) return null;

  try {
    const config = await GuildConfigSchema.findOne({ guildId: guild.id });
    const targetKey = `${channelType}ChannelId`;
    const configuredChannelId = config?.[targetKey] || config?.dailyChannelId;

    // 1. Try explicitly configured channel
    if (configuredChannelId) {
      const channel =
        guild.channels.cache.get(configuredChannelId) ||
        (await guild.channels.fetch(configuredChannelId).catch(() => null));

      if (channel && channel.isTextBased()) {
        return channel;
      }
    }

    // 2. Try legacy environment variable if set and part of this guild
    const legacyEnvId = process.env[BOT_CONFIG.DAILY_CHANNEL_ENV];
    if (legacyEnvId) {
      const legacyChannel =
        guild.channels.cache.get(legacyEnvId) ||
        (await guild.channels.fetch(legacyEnvId).catch(() => null));

      if (legacyChannel && legacyChannel.isTextBased()) {
        return legacyChannel;
      }
    }

    // 3. Try server's systemChannel
    if (guild.systemChannel && guild.systemChannel.isTextBased()) {
      const botMember = guild.members.me;
      const permissions = guild.systemChannel.permissionsFor(botMember);
      if (
        permissions &&
        permissions.has(PermissionFlagsBits.SendMessages) &&
        permissions.has(PermissionFlagsBits.ViewChannel)
      ) {
        return guild.systemChannel;
      }
    }

    // 4. Fallback: Find the first writable text channel in the guild
    const botMember = guild.members.me || (client ? await guild.members.fetch(client.user.id).catch(() => null) : null);
    const fallbackChannel = guild.channels.cache.find((ch) => {
      if (!ch.isTextBased() || ch.type === ChannelType.GuildVoice) return false;
      if (!botMember) return true;
      const permissions = ch.permissionsFor(botMember);
      return (
        permissions &&
        permissions.has(PermissionFlagsBits.SendMessages) &&
        permissions.has(PermissionFlagsBits.ViewChannel)
      );
    });

    return fallbackChannel || null;
  } catch (err) {
    console.error(`Error resolving channel for guild ${guild.id}:`, err);
    return null;
  }
}
