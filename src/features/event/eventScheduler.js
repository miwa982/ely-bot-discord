import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { BOT_CONFIG } from "../../constants/bot.js";
import EventSchema from "../../db/Event/eventSchema.js";
import { Elysia } from "../../utils/elysia.js";
import { calculateWeeklyDates } from "../../utils/scheduleParser.js";

export async function processEvents(client) {
  const now = new Date();

  try {
    const events = await EventSchema.find();

    for (const ev of events) {
      const channel = await client.channels.fetch(ev.channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) continue;

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
          ev.startDate = new Date(ev.startDate.getTime() + intervalMs);
          ev.endDate = new Date(ev.endDate.getTime() + intervalMs);
          ev.started = false;
          ev.ended = false;
          ev.sentReminderLabels = [];
        }
      }

      await ev.save();
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
