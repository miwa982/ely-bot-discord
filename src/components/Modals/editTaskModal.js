import { TASK_STATUS_UI } from "../../constants/bot.js";
import {
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  LabelBuilder,
  TextInputStyle,
  TextInputBuilder,
} from "discord.js";

export default {
  build: async (tasks, type) => {
    const lstStatus = Object.values(TASK_STATUS_UI).map(
      (status) => ({
        label: status.name,
        value: status.code,
      }),
    );

    // Convert each task into a Discord option
    const optionTaskBuilders = tasks.map((task) => {
      const shortTitle =
        task.title.length > 45
          ? task.title.substring(0, 42) + "..."
          : task.title;

      return new StringSelectMenuOptionBuilder()
        .setLabel(shortTitle)
        .setValue(task._id.toString());
    });

    const optionStatusBuilders = lstStatus.map((status) =>
      new StringSelectMenuOptionBuilder()
        .setEmoji("📌")
        .setLabel(status.label)
        .setValue(status.value)
        .setDescription(`Set status to ${status.label}`),
    );

    const modal = new ModalBuilder()
      .setCustomId(`edit-task-modal:${type}`)
      .setTitle("Edit Task");

    const selectTaskMenu = new LabelBuilder()
      .setLabel("Task list")
      .setStringSelectMenuComponent(
        new StringSelectMenuBuilder()
          .setCustomId("select-edit-task")
          .setPlaceholder("Choose the task")
          .addOptions(...optionTaskBuilders)
          .setRequired(true),
      );

    const textInputEditTask = new LabelBuilder()
      .setLabel("New task name")
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("input-edit-task")
          .setPlaceholder("Rename the task")
          .setStyle(TextInputStyle.Short)
          .setRequired(false),
      );
    const selectStatusMenu = new LabelBuilder()
      .setLabel("Status")
      .setStringSelectMenuComponent(
        new StringSelectMenuBuilder()
          .setCustomId("select-edit-task-status")
          .setPlaceholder("Choose the status")
          .addOptions(...optionStatusBuilders)
          .setRequired(true),
      );

    modal.addLabelComponents([
      selectTaskMenu,
      textInputEditTask,
      selectStatusMenu,
    ]);

    return modal;
  },
};
