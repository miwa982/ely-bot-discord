import { EmbedBuilder } from "discord.js";
import {
  buildDeleteSelectMenu,
  buildEditSelectMenu,
  buildEventDashboard,
  buildEventList,
  buildPresetSelectMenu,
  EVENT_PRESETS,
} from "../../components/Event/eventDashboard.js";
import createEventModal, {
  CREATE_EVENT_MODAL_ID,
} from "../../components/Modals/createEventModal.js";
import {
  buildEditEventModal,
  EDIT_EVENT_MODAL_PREFIX,
} from "../../components/Modals/editEventModal.js";
import { BOT_CONFIG, DISCORD_FLAGS } from "../../constants/bot.js";
import EventSchema from "../../db/Event/eventSchema.js";
import GuildConfigSchema from "../../db/GuildConfig/guildConfigSchema.js";
import {
  parseReminderString,
  parseScheduleInput,
} from "../../utils/scheduleParser.js";

export default async (interaction, client) => {
  // 1. Handle Modal Submissions
  if (interaction.isModalSubmit()) {
    // 1a. Create Event Modal
    if (interaction.customId === CREATE_EVENT_MODAL_ID) {
      const title = interaction.fields.getTextInputValue("event-title");
      const rawSchedule = interaction.fields.getTextInputValue("event-schedule");
      const rawReminders = interaction.fields.getTextInputValue("event-reminders") || "1d, 2h, 1h, 30m";
      const thumbnailUrl = interaction.fields.getTextInputValue("event-thumbnail") || "";
      const description = interaction.fields.getTextInputValue("event-description") || "";

      const parsedSchedule = parseScheduleInput(rawSchedule);
      if (!parsedSchedule) {
        return interaction.reply({
          content:
            "❌ **Invalid schedule format.**\n\n" +
            "Examples of valid schedules:\n" +
            "• **Weekly**: `Mon 15:00 - Wed 22:00` or `Fri 2PM - Sun 9PM`\n" +
            "• **Weekly Reset**: `Mon 04:00 - Sun 04:00`\n" +
            "• **Interval**: `Every 14d from 2026-09-01 10:00` or `Every 3d`\n" +
            "• **One-time**: `2026-09-01 10:00 - 2026-09-15 18:00`",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      const reminderThresholds = parseReminderString(rawReminders);

      let targetChannelId = interaction.channelId;
      if (interaction.guildId) {
        const config = await GuildConfigSchema.findOne({ guildId: interaction.guildId });
        if (config?.eventChannelId) {
          targetChannelId = config.eventChannelId;
        }
      }

      const newEvent = await EventSchema.create({
        title,
        description,
        channelId: targetChannelId,
        guildId: interaction.guildId,
        thumbnailUrl,
        rawSchedule,
        scheduleType: parsedSchedule.scheduleKind,
        weeklyPattern: parsedSchedule.weeklyPattern || null,
        interval: parsedSchedule.intervalDays || 0,
        startDate: parsedSchedule.startDate,
        endDate: parsedSchedule.endDate,
        rawReminders,
        reminderThresholds,
      });

      const startUnix = Math.floor(newEvent.startDate.getTime() / 1000);
      const endUnix = newEvent.endDate ? Math.floor(newEvent.endDate.getTime() / 1000) : null;

      const confirmEmbed = new EmbedBuilder()
        .setAuthor({
          name: "Elysia Event Manager",
          iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
        })
        .setTitle(`✅ Event Created: ${title}`)
        .setColor(BOT_CONFIG.EMBED_COLOR)
        .setDescription(
          `**Schedule:** \`${rawSchedule}\`\n` +
            `**Start:** <t:${startUnix}:F> (<t:${startUnix}:R>)\n` +
            (endUnix ? `**End:** <t:${endUnix}:F> (<t:${endUnix}:R>)\n` : "") +
            `**Channel:** <#${targetChannelId}>\n` +
            `**Reminders:** \`${rawReminders}\`\n` +
            (description ? `**Description:** *${description}*\n` : ""),
        )
        .setThumbnail(thumbnailUrl || "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
        .setFooter({ text: "Use /event to view or manage all events" })
        .setTimestamp();

      return interaction.reply({
        embeds: [confirmEmbed],
      });
    }

    // 1b. Edit Event Modal
    if (interaction.customId.startsWith(EDIT_EVENT_MODAL_PREFIX)) {
      const eventId = interaction.customId.replace(EDIT_EVENT_MODAL_PREFIX, "");
      const title = interaction.fields.getTextInputValue("event-title");
      const rawSchedule = interaction.fields.getTextInputValue("event-schedule");
      const rawReminders = interaction.fields.getTextInputValue("event-reminders") || "1d, 2h, 1h, 30m";
      const thumbnailUrl = interaction.fields.getTextInputValue("event-thumbnail") || "";
      const description = interaction.fields.getTextInputValue("event-description") || "";

      const parsedSchedule = parseScheduleInput(rawSchedule);
      if (!parsedSchedule) {
        return interaction.reply({
          content:
            "❌ **Invalid schedule format.**\n\n" +
            "Examples of valid schedules:\n" +
            "• **Weekly**: `Mon 15:00 - Wed 22:00` or `Fri 2PM - Sun 9PM`\n" +
            "• **Weekly Reset**: `Mon 04:00 - Sun 04:00`\n" +
            "• **Interval**: `Every 14d from 2026-09-01 10:00` or `Every 3d`\n" +
            "• **One-time**: `2026-09-01 10:00 - 2026-09-15 18:00`",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      const reminderThresholds = parseReminderString(rawReminders);

      const updatedEvent = await EventSchema.findByIdAndUpdate(
        eventId,
        {
          title,
          description,
          thumbnailUrl,
          rawSchedule,
          scheduleType: parsedSchedule.scheduleKind,
          weeklyPattern: parsedSchedule.weeklyPattern || null,
          interval: parsedSchedule.intervalDays || 0,
          startDate: parsedSchedule.startDate,
          endDate: parsedSchedule.endDate,
          rawReminders,
          reminderThresholds,
          started: false,
          ended: false,
          sentReminderLabels: [],
        },
        { new: true },
      );

      if (!updatedEvent) {
        return interaction.reply({
          content: "❌ Event not found or was deleted.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      const startUnix = Math.floor(updatedEvent.startDate.getTime() / 1000);
      const endUnix = updatedEvent.endDate ? Math.floor(updatedEvent.endDate.getTime() / 1000) : null;

      const confirmEmbed = new EmbedBuilder()
        .setAuthor({
          name: "Elysia Event Manager",
          iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
        })
        .setTitle(`✅ Event Updated: ${title}`)
        .setColor(BOT_CONFIG.EMBED_COLOR)
        .setDescription(
          `**Schedule:** \`${rawSchedule}\`\n` +
            `**Start:** <t:${startUnix}:F> (<t:${startUnix}:R>)\n` +
            (endUnix ? `**End:** <t:${endUnix}:F> (<t:${endUnix}:R>)\n` : "") +
            `**Channel:** <#${updatedEvent.channelId}>\n` +
            `**Reminders:** \`${rawReminders}\`\n` +
            (description ? `**Description:** *${description}*\n` : ""),
        )
        .setThumbnail(thumbnailUrl || "https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
        .setFooter({ text: "Use /event dashboard to manage events" })
        .setTimestamp();

      return interaction.reply({
        embeds: [confirmEmbed],
      });
    }
  }

  // 2. Handle Interactive Buttons
  if (interaction.isButton()) {
    if (interaction.customId === "btn-event-add") {
      const modal = createEventModal.build();
      return interaction.showModal(modal);
    }

    if (interaction.customId === "btn-event-presets") {
      const dashboard = await buildEventDashboard(interaction.guildId);
      const presetRow = buildPresetSelectMenu();

      return interaction.update({
        embeds: dashboard.embeds,
        components: [...dashboard.components, presetRow],
      });
    }

    if (interaction.customId === "btn-event-edit") {
      const dashboard = await buildEventDashboard(interaction.guildId);
      if (dashboard.events.length === 0) {
        return interaction.reply({
          content: "ℹ️ No events available to edit.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      const editRow = buildEditSelectMenu(dashboard.events);
      return interaction.update({
        embeds: dashboard.embeds,
        components: [...dashboard.components, editRow],
      });
    }

    if (interaction.customId === "btn-event-delete") {
      const dashboard = await buildEventDashboard(interaction.guildId);
      if (dashboard.events.length === 0) {
        return interaction.reply({
          content: "ℹ️ No events available to delete.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      const deleteRow = buildDeleteSelectMenu(dashboard.events);
      return interaction.update({
        embeds: dashboard.embeds,
        components: [...dashboard.components, deleteRow],
      });
    }

    if (interaction.customId === "btn-event-refresh") {
      const dashboard = await buildEventDashboard(interaction.guildId);
      return interaction.update({
        embeds: dashboard.embeds,
        components: dashboard.components,
      });
    }

    if (interaction.customId === "btn-event-list-refresh") {
      const list = await buildEventList(interaction.guildId);
      return interaction.update({
        embeds: list.embeds,
        components: list.components,
      });
    }
  }

  // 3. Handle Select Menus
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "select-event-preset") {
      const selectedValue = interaction.values[0];
      const presetId = selectedValue.replace("preset:", "");
      const preset = EVENT_PRESETS.find((p) => p.id === presetId);

      if (!preset) {
        return interaction.reply({
          content: "❌ Preset not found.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      const parsedSchedule = parseScheduleInput(preset.schedule);
      const reminderThresholds = parseReminderString(preset.reminders);

      let targetChannelId = interaction.channelId;
      if (interaction.guildId) {
        const config = await GuildConfigSchema.findOne({ guildId: interaction.guildId });
        if (config?.eventChannelId) {
          targetChannelId = config.eventChannelId;
        }
      }

      await EventSchema.create({
        title: preset.title,
        description: preset.description,
        channelId: targetChannelId,
        guildId: interaction.guildId,
        thumbnailUrl: preset.thumbnail,
        rawSchedule: preset.schedule,
        scheduleType: parsedSchedule.scheduleKind,
        weeklyPattern: parsedSchedule.weeklyPattern || null,
        interval: parsedSchedule.intervalDays || 0,
        startDate: parsedSchedule.startDate,
        endDate: parsedSchedule.endDate,
        rawReminders: preset.reminders,
        reminderThresholds,
      });

      const updatedDashboard = await buildEventDashboard(interaction.guildId);
      return interaction.update({
        embeds: updatedDashboard.embeds,
        components: updatedDashboard.components,
      });
    }

    if (interaction.customId === "select-event-edit") {
      const selectedValue = interaction.values[0];
      const eventId = selectedValue.replace("edit-event:", "");
      const event = await EventSchema.findById(eventId);

      if (!event) {
        return interaction.reply({
          content: "❌ Event not found or already deleted.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }

      const modal = buildEditEventModal(event);
      return interaction.showModal(modal);
    }

    if (interaction.customId === "select-event-delete") {
      const selectedValue = interaction.values[0];
      const eventId = selectedValue.replace("delete-event:", "");

      await EventSchema.findByIdAndDelete(eventId);

      const updatedDashboard = await buildEventDashboard(interaction.guildId);
      return interaction.update({
        embeds: updatedDashboard.embeds,
        components: updatedDashboard.components,
      });
    }
  }
};
