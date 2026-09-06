import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { BOT_CONFIG } from "../../constants/bot.js";
import EventSchema from "../../db/Event/eventSchema.js";
import GuildConfigSchema from "../../db/GuildConfig/guildConfigSchema.js";
import { Elysia } from "../../utils/elysia.js";
import { resolveGuildChannel } from "../../utils/guildConfig.js";
import { calculateWeeklyDates } from "../../utils/scheduleParser.js";

async function resolveEventChannel(client, ev) {
  let channel = null;

  // 1. Check if guild has a configured event channel
  if (ev.guildId) {
    const config = await GuildConfigSchema.findOne({ guildId: ev.guildId });
    if (config?.eventChannelId) {
      channel =
        client.channels.cache.get(config.eventChannelId) ||
        (await client.channels.fetch(config.eventChannelId).catch(() => null));
    }
  }

  // 2. If no configured channel, fallback to the channel saved on the event
  if ((!channel || !channel.isTextBased()) && ev.channelId) {
    channel =
      client.channels.cache.get(ev.channelId) ||
      (await client.channels.fetch(ev.channelId).catch(() => null));
  }

  // 3. If ev.guildId is missing, attempt to recover it from channel and re-check guild config
  if (!ev.guildId && channel?.guildId) {
    ev.guildId = channel.guildId;
    const config = await GuildConfigSchema.findOne({ guildId: ev.guildId });
    if (config?.eventChannelId && config.eventChannelId !== channel.id) {
      const configuredChan =
        client.channels.cache.get(config.eventChannelId) ||
        (await client.channels.fetch(config.eventChannelId).catch(() => null));
      if (configuredChan && configuredChan.isTextBased()) {
        channel = configuredChan;
      }
    }
  }

  // 4. Fallback: resolve via guild channel fallback logic
  if ((!channel || !channel.isTextBased()) && ev.guildId) {
    const guild =
      client.guilds.cache.get(ev.guildId) ||
      (await client.guilds.fetch(ev.guildId).catch(() => null));
    if (guild) {
      channel = await resolveGuildChannel(guild, "event", client);
    }
  }

  return channel && channel.isTextBased() ? channel : null;
}

export async function processEvents(client) {
  const now = new Date();

  try {
    const events = await EventSchema.find();

    for (const ev of events) {
      const channel = await resolveEventChannel(client, ev);
      if (!channel) continue;

      let modified = false;

      // Keep channelId synchronized if the configured channel changed
      if (ev.channelId !== channel.id) {
        ev.channelId = channel.id;
        modified = true;
      }

      const defaultImage = Elysia.DEFAULT_REMINDER_IMG;
      const eventImage = ev.thumbnailUrl || ev.event_start || defaultImage;

      // 1. Event Start Alert
      if (!ev.started && ev.startDate <= now && (!ev.endDate || now < ev.endDate)) {
        const startEmbed = new EmbedBuilder()
          .setAuthor({
            name: "Elysia Event Alert 🌸",
            iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
          })
          .setTitle(`🎉 ${ev.title} has started!`)
          .setColor(BOT_CONFIG.EMBED_COLOR)
          .setDescription(
            (ev.description ? `*${ev.description}*\n\n` : "") +
              (ev.endDate
                ? `⏰ **Ends:** <t:${Math.floor(ev.endDate.getTime() / 1000)}:F> (<t:${Math.floor(ev.endDate.getTime() / 1000)}:R>)`
                : "Ongoing event."),
          )
          .setImage(ev.thumbnailUrl || ev.event_start || defaultImage)
          .setTimestamp();

        await channel.send({
          content: `@everyone 🎉 **${ev.title}** has started!`,
          embeds: [startEmbed],
        });

        ev.started = true;
        modified = true;
      }

      // 2. Dynamic Reminders Before End
      if (ev.endDate && ev.started && !ev.ended && now < ev.endDate) {
        const remainingMs = ev.endDate.getTime() - now.getTime();
        const thresholds = ev.reminderThresholds || [];

        for (const reminder of thresholds) {
          if (
            remainingMs > 0 &&
            remainingMs <= reminder.ms &&
            !ev.sentReminderLabels.includes(reminder.label)
          ) {
            const reminderEmbed = new EmbedBuilder()
              .setAuthor({
                name: "Elysia Event Reminder ⏰",
                iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
              })
              .setTitle(`⏰ Reminder: ${ev.title}`)
              .setColor(BOT_CONFIG.EMBED_COLOR)
              .setDescription(
                (ev.description ? `*${ev.description}*\n\n` : "") +
                  `⚠️ Ends in less than **${reminder.label}**! (<t:${Math.floor(ev.endDate.getTime() / 1000)}:R>)\n` +
                  `Make sure to complete your runs and finalize your score! ✨`,
              )
              .setImage(ev.thumbnailUrl || ev.event_remind || defaultImage)
              .setTimestamp();

            await channel.send({
              content: `@everyone ⏰ Reminder: **${ev.title}** ends in less than **${reminder.label}**! (<t:${Math.floor(ev.endDate.getTime() / 1000)}:R>)`,
              embeds: [reminderEmbed],
            });

            ev.sentReminderLabels.push(reminder.label);
            modified = true;
          }
        }
      }

      // 3. Event Ended Alert & Cycle Rollover
      if (ev.endDate && ev.started && !ev.ended && now >= ev.endDate) {
        const endEmbed = new EmbedBuilder()
          .setAuthor({
            name: "Elysia Event Notice 🌸",
            iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
          })
          .setTitle(`✨ ${ev.title} has ended!`)
          .setColor(BOT_CONFIG.EMBED_COLOR)
          .setDescription(
            (ev.description ? `*${ev.description}*\n\n` : "") +
              `This cycle has officially concluded. Thanks for your hard work! 🎶`,
          )
          .setImage(ev.thumbnailUrl || ev.event_end || defaultImage)
          .setTimestamp();

        await channel.send({
          content: `@everyone 🌸 **${ev.title}** has ended!`,
          embeds: [endEmbed],
        });

        ev.ended = true;
        modified = true;

        // Rollover for weekly cycles
        if (ev.scheduleType === "weekly" && ev.weeklyPattern) {
          const nextCycle = calculateWeeklyDates(
            ev.weeklyPattern,
            new Date(now.getTime() + 60 * 1000),
            7,
          );
          ev.startDate = nextCycle.startDate;
          ev.endDate = nextCycle.endDate;
          ev.started = false;
          ev.ended = false;
          ev.sentReminderLabels = [];
        } else if (ev.scheduleType === "interval" && ev.interval > 0) {
          const intervalMs = ev.interval * 24 * 60 * 60 * 1000;
          do {
            ev.startDate = new Date(ev.startDate.getTime() + intervalMs);
            ev.endDate = new Date(ev.endDate.getTime() + intervalMs);
          } while (ev.endDate <= now);
          ev.started = false;
          ev.ended = false;
          ev.sentReminderLabels = [];
        }
      }

      if (modified) {
        await ev.save();
      }
    }
  } catch (error) {
    console.error("Error processing events:", error);
  }
}

export function startEventScheduler(client) {
  // Check on startup
  processEvents(client);

  // Run every 30 seconds
  return setInterval(() => {
    processEvents(client);
  }, 30_000);
}
