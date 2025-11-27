import enumData from '../../enum/enumData.js';
import {
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    LabelBuilder,
    TextInputStyle,
    TextInputBuilder
} from 'discord.js';

export default {
    build: async (tasks, type) => {
        // Convert each task into a Discord option
        const optionTaskBuilders = tasks.map(task =>
            new StringSelectMenuOptionBuilder()
                .setLabel(task.title)
                .setValue(task._id.toString())
        );

        const modal = new ModalBuilder().setCustomId(`remove-task-modal:${type}`)
            .setTitle('Remove Task')

        const selectTaskMenu = new LabelBuilder()
            .setLabel('Task list')
            .setStringSelectMenuComponent(
                new StringSelectMenuBuilder()
                    .setCustomId('select-remove-task')
                    .setPlaceholder('Choose the task')
                    .addOptions(...optionTaskBuilders)
                    .setRequired(true)
            )

        modal.addLabelComponents([selectTaskMenu]);

        return modal;
    }
}