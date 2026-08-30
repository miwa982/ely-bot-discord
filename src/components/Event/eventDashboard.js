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

export const EVENT_PRESETS = [
  {
    id: "hi3-abyss-1",
    title: "HI3 Superstring Dimension (Mon-Wed)",
    schedule: "Mon 15:00 - Wed 22:00",
    reminders: "1d, 2h, 1h, 30m",
    thumbnail: "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif",
    description: "Honkai Impact 3rd Superstring Abyss Cycle 1. Finalize your score before 22:00!",
  },
  {
    id: "hi3-abyss-2",
    title: "HI3 Superstring Dimension (Fri-Sun)",
    schedule: "Fri 15:00 - Sun 22:00",
    reminders: "1d, 2h, 1h, 30m",
    thumbnail: "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif",
    description: "Honkai Impact 3rd Superstring Abyss Cycle 2. Finalize your score before 22:00!",
  },
  {
    id: "hi3-er",
    title: "HI3 Elysian Realm Weekly",
    schedule: "Mon 04:00 - Sun 23:59",
    reminders: "1d, 6h, 2h",
    thumbnail: "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif",
    description: "Clear your weekly Deep Sequence runs for full crystal rewards!",
  },
  {
    id: "hoyo-weekly-reset",
    title: "Hoyoverse Weekly Reset",
    schedule: "Mon 04:00 - Sun 04:00",
    reminders: "1d, 2h",
    thumbnail: "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif",
    description: "Weekly Bosses, Simulated Universe, and battle pass reset.",
  },
];

export async function buildEventDashboard(guildId = null) {
  const events = await EventSchema.find(guildId ? { guildId } : {}).sort({ startDate: 1 });
  const now = new Date();

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Elysia Event Manager",
      iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
    })
    .setTitle("🌸 Game Events & Recurring Schedules")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
    .setFooter({ text: "All schedules automatically follow UTC+7" })
    .setTimestamp();

  if (events.length === 0) {
    embed.setDescription(
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

    embed.setDescription(eventLines.join("\n\n"));
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
