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

    const modal = new ModalBuilder()
      .setCustomId(`remove-task-modal:${type}`)
      .setTitle("Remove Task");

    const selectTaskMenu = new LabelBuilder()
      .setLabel("Task list")
      .setStringSelectMenuComponent(
        new StringSelectMenuBuilder()
          .setCustomId("select-remove-task")
          .setPlaceholder("Choose the task")
          .addOptions(...optionTaskBuilders)
          .setRequired(true),
      );

    modal.addLabelComponents([selectTaskMenu]);

    return modal;
  },
};
