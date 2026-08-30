import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export const CREATE_EVENT_MODAL_ID = "create-event-modal";

export default {
  build: () => {
    const modal = new ModalBuilder()
      .setCustomId(CREATE_EVENT_MODAL_ID)
      .setTitle("Create Event / Game Schedule");

    const titleInput = new TextInputBuilder()
      .setCustomId("event-title")
      .setLabel("Event Title")
      .setPlaceholder("e.g. HI3 Superstring Dimension")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const scheduleInput = new TextInputBuilder()
      .setCustomId("event-schedule")
      .setLabel("Schedule (Weekly, Interval, or Date Range)")
      .setPlaceholder("e.g. Mon 15:00 - Wed 22:00 or Every 14d")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reminderInput = new TextInputBuilder()
      .setCustomId("event-reminders")
      .setLabel("Dynamic Reminders Before End")
      .setPlaceholder("e.g. 1d, 2h, 1h, 30m")
      .setValue("1d, 2h, 1h, 30m")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const thumbnailInput = new TextInputBuilder()
      .setCustomId("event-thumbnail")
      .setLabel("Thumbnail / Image URL (Optional)")
      .setPlaceholder("https://... (or leave blank for default Elysia gif)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("event-description")
      .setLabel("Description / Notes (Optional)")
      .setPlaceholder("Event notes, guidelines, or cycle details...")
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
  },
};
