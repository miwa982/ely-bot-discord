import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { BOT_CONFIG } from "../../constants/bot.js";
import EventSchema from "../../db/Event/eventSchema.js";
import GuildConfigSchema from "../../db/GuildConfig/guildConfigSchema.js";

export const EVENT_PRESETS = [
  {
    id: "hi3-abyss-1",
    title: "HI3 Superstring Dimension (Mon-Wed)",
    schedule: "Mon 14:00 - Wed 21:00",
    reminders: "1d, 2h, 1h, 30m",
    thumbnail: "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif",
    description: "Honkai Impact 3rd Superstring Abyss Cycle 1. Finalize your score before 21:00 (9PM UTC+7)!",
  },
  {
    id: "hi3-abyss-2",
    title: "HI3 Superstring Dimension (Fri-Sun)",
    schedule: "Fri 14:00 - Sun 21:00",
    reminders: "1d, 2h, 1h, 30m",
    thumbnail: "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif",
    description: "Honkai Impact 3rd Superstring Abyss Cycle 2. Finalize your score before 21:00 (9PM UTC+7)!",
  },
  {
    id: "hi3-er",
    title: "HI3 Elysian Realm Weekly",
    schedule: "Mon 03:00 - Sun 23:00",
    reminders: "1d, 6h, 2h",
    thumbnail: "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif",
    description: "Clear your weekly Deep Sequence runs for full crystal rewards before weekly reset!",
  },
  {
    id: "hi3-ma",
    title: "HI3 Memorial Arena",
    schedule: "Tue 03:00 - Sun 23:00",
    reminders: "1d, 6h, 2h",
    thumbnail: "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif",
    description: "Defeat SSS Bosses and lock in your Memorial Arena ranking!",
  },
  {
    id: "hoyo-weekly-reset",
    title: "Hoyoverse Weekly Reset",
    schedule: "Mon 03:00 - Sun 03:00",
    reminders: "1d, 2h",
    thumbnail: "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif",
    description: "Weekly Bosses, Simulated/Divergent Universe, and weekly mission resets (03:00 UTC+7 / 04:00 UTC+8).",
  },
];

/**
 * Builds the interactive Event Dashboard (for event administrators and managers)
 */
export async function buildEventDashboard(guildId = null) {
  const events = await EventSchema.find(guildId ? { guildId } : {}).sort({ startDate: 1 });
  const now = new Date();

  let channelNotice = "";
  if (guildId) {
    const config = await GuildConfigSchema.findOne({ guildId });
    if (config?.eventChannelId) {
      channelNotice = `📢 **Notification Channel:** <#${config.eventChannelId}>`;
    } else {
      channelNotice = `📢 **Notification Channel:** Server Default / Current *(Use \`/config set-channel type:event\` to assign a channel)*`;
    }
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Elysia Event Manager",
      iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
    })
    .setTitle("🌸 Game Events & Recurring Schedules Dashboard")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
    .setFooter({ text: "All schedules automatically follow UTC+7 • Elysia Bot" })
    .setTimestamp();

  if (events.length === 0) {
    embed.setDescription(
      (channelNotice ? `${channelNotice}\n\n` : "") +
        "✨ No active events or schedules registered yet.\n\n" +
        "Click **`➕ Add Event`** or choose a **`⚡ Quick Preset`** below to create one!",
    );
  } else {
    const eventLines = events.map((ev, index) => {
      const isOngoing = ev.startDate <= now && (!ev.endDate || ev.endDate > now);
      const isUpcoming = ev.startDate > now;
      const statusIcon = isOngoing ? "🟢 **Ongoing**" : isUpcoming ? "🟡 **Upcoming**" : "⚪ **Ended**";

      const startUnix = Math.floor(ev.startDate.getTime() / 1000);
      const endUnix = ev.endDate ? Math.floor(ev.endDate.getTime() / 1000) : null;

      let timeInfo = `Starts: <t:${startUnix}:F> (<t:${startUnix}:R>)`;
      if (ev.endDate) {
        if (isOngoing) {
          timeInfo = `Ends in: <t:${endUnix}:R> (<t:${endUnix}:F>)`;
        } else {
          timeInfo = `Start: <t:${startUnix}:F>\nEnd: <t:${endUnix}:F> (<t:${endUnix}:R>)`;
        }
      }

      const scheduleText = ev.rawSchedule ? `\n📆 \`${ev.rawSchedule}\`` : "";
      const reminderText = ev.rawReminders ? `\n⏰ Reminders: \`${ev.rawReminders}\`` : "";
      const descText = ev.description ? `\n📝 *${ev.description}*` : "";

      return `**${index + 1}. ${ev.title}** — ${statusIcon}\n${timeInfo}${scheduleText}${reminderText}${descText}`;
    });

    embed.setDescription(
      (channelNotice ? `${channelNotice}\n\n` : "") +
        eventLines.join("\n\n"),
    );
  }

  const actionButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("btn-event-add")
      .setLabel("Add Event")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("btn-event-presets")
      .setLabel("Quick Presets")
      .setEmoji("⚡")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("btn-event-edit")
      .setLabel("Edit Event")
      .setEmoji("✏️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(events.length === 0),
    new ButtonBuilder()
      .setCustomId("btn-event-delete")
      .setLabel("Delete Event")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(events.length === 0),
    new ButtonBuilder()
      .setCustomId("btn-event-refresh")
      .setLabel("Refresh")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary),
  );

  return {
    embeds: [embed],
    components: [actionButtons],
    events,
  };
}

/**
 * Builds the clean public Event Timetable (for regular members via /event list)
 */
export async function buildEventList(guildId = null) {
  const events = await EventSchema.find(guildId ? { guildId } : {}).sort({ startDate: 1 });
  const now = new Date();

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Elysia Schedule & Timetable",
      iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
    })
    .setTitle("📅 Game Events & Schedules Timetable")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
    .setFooter({ text: "All event times automatically follow UTC+7 • Elysia Bot" })
    .setTimestamp();

  if (events.length === 0) {
    embed.setDescription(
      "🌸 **No active events or game schedules registered in this server yet.**\n\n" +
        "💡 *Admins can use `/event dashboard` or `/event create` to set up schedules with automatic countdown reminders!*",
    );
  } else {
    const ongoing = events.filter((ev) => ev.startDate <= now && (!ev.endDate || ev.endDate > now));
    const upcoming = events.filter((ev) => ev.startDate > now);
    const concluded = events.filter((ev) => ev.endDate && ev.endDate <= now);

    const descriptionSections = [];

    if (ongoing.length > 0) {
      const ongoingLines = ongoing.map((ev) => {
        const endUnix = ev.endDate ? Math.floor(ev.endDate.getTime() / 1000) : null;
        const timeStr = endUnix ? `Ends in: <t:${endUnix}:R> (<t:${endUnix}:F>)` : "Ongoing indefinitely";
        const schedStr = ev.rawSchedule ? `\n📆 \`${ev.rawSchedule}\`` : "";
        const descStr = ev.description ? `\n📝 *${ev.description}*` : "";
        return `• **${ev.title}**\n↳ ${timeStr}${schedStr}${descStr}`;
      });
      descriptionSections.push("🟢 **Ongoing Events:**\n" + ongoingLines.join("\n\n"));
    }

    if (upcoming.length > 0) {
      const upcomingLines = upcoming.map((ev) => {
        const startUnix = Math.floor(ev.startDate.getTime() / 1000);
        const timeStr = `Starts: <t:${startUnix}:R> (<t:${startUnix}:F>)`;
        const schedStr = ev.rawSchedule ? `\n📆 \`${ev.rawSchedule}\`` : "";
        const descStr = ev.description ? `\n📝 *${ev.description}*` : "";
        return `• **${ev.title}**\n↳ ${timeStr}${schedStr}${descStr}`;
      });
      descriptionSections.push("🟡 **Upcoming Events:**\n" + upcomingLines.join("\n\n"));
    }

    if (concluded.length > 0) {
      const concludedLines = concluded.map((ev) => {
        const endUnix = Math.floor(ev.endDate.getTime() / 1000);
        return `• **${ev.title}** (Ended <t:${endUnix}:R>)`;
      });
      descriptionSections.push("⚪ **Recently Concluded:**\n" + concludedLines.join("\n"));
    }

    embed.setDescription(descriptionSections.join("\n\n━━━━━━━━━━━━━━━━━━━━\n\n"));
  }

  const refreshButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("btn-event-list-refresh")
      .setLabel("Refresh Timetable")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary),
  );

  return {
    embeds: [embed],
    components: [refreshButton],
    events,
  };
}

export function buildPresetSelectMenu() {
  const options = EVENT_PRESETS.map((preset) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(preset.title)
      .setValue(`preset:${preset.id}`)
      .setDescription(`${preset.schedule} (Reminders: ${preset.reminders})`),
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("select-event-preset")
    .setPlaceholder("Select a game event preset to add")
    .addOptions(options);

  return new ActionRowBuilder().addComponents(selectMenu);
}

export function buildEditSelectMenu(events) {
  const options = events.slice(0, 25).map((ev, index) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${index + 1}. ${ev.title.slice(0, 80)}`)
      .setValue(`edit-event:${ev._id.toString()}`)
      .setDescription(ev.rawSchedule ? `Schedule: ${ev.rawSchedule.slice(0, 45)}` : "Custom event"),
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("select-event-edit")
    .setPlaceholder("Select an event to edit")
    .addOptions(options);

  return new ActionRowBuilder().addComponents(selectMenu);
}

export function buildDeleteSelectMenu(events) {
  const options = events.slice(0, 25).map((ev, index) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${index + 1}. ${ev.title.slice(0, 80)}`)
      .setValue(`delete-event:${ev._id.toString()}`)
      .setDescription(ev.rawSchedule ? `Schedule: ${ev.rawSchedule.slice(0, 45)}` : "Custom event"),
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("select-event-delete")
    .setPlaceholder("Select an event to delete")
    .addOptions(options);

  return new ActionRowBuilder().addComponents(selectMenu);
}
