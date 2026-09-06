import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export const EDIT_EVENT_MODAL_PREFIX = "edit-event-modal:";

/**
 * Builds the pre-filled modal to edit an existing event
 * @param {object} event - Mongoose event document
 */
export function buildEditEventModal(event) {
  const modal = new ModalBuilder()
    .setCustomId(`${EDIT_EVENT_MODAL_PREFIX}${event._id.toString()}`)
    .setTitle(`Edit: ${event.title.slice(0, 35)}`);

  const titleInput = new TextInputBuilder()
    .setCustomId("event-title")
    .setLabel("Event Title")
    .setValue(event.title || "")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const scheduleInput = new TextInputBuilder()
    .setCustomId("event-schedule")
    .setLabel("Schedule (Weekly, Interval, or Date Range)")
    .setValue(event.rawSchedule || "")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const reminderInput = new TextInputBuilder()
    .setCustomId("event-reminders")
    .setLabel("Dynamic Reminders Before End")
    .setValue(event.rawReminders || "1d, 2h, 1h, 30m")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const thumbnailInput = new TextInputBuilder()
    .setCustomId("event-thumbnail")
    .setLabel("Thumbnail / Image URL (Optional)")
    .setValue(event.thumbnailUrl || "")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const descriptionInput = new TextInputBuilder()
    .setCustomId("event-description")
    .setLabel("Description / Notes (Optional)")
    .setValue(event.description || "")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(scheduleInput),
    new ActionRowBuilder().addComponents(reminderInput),
    new ActionRowBuilder().addComponents(thumbnailInput),
    new ActionRowBuilder().addComponents(descriptionInput),
  );

  return modal;
}
