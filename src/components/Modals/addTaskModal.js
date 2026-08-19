import {
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
    LabelBuilder
} from 'discord.js';
import { TASK_SUGGESTIONS } from '../../constants/bot.js';

export default {
    build: async (type) => {
        const optionBuilders = TASK_SUGGESTIONS.map(task =>
            new StringSelectMenuOptionBuilder()
                .setLabel(task.name)
                .setValue(task.name)
        );

        const modal = new ModalBuilder().setCustomId(`add-task-modal:${type}`)
            .setTitle('Add Task')

        const selectTaskMenu = new LabelBuilder()
            .setLabel('Suggestion task')
            .setStringSelectMenuComponent(
                new StringSelectMenuBuilder()
                    .setCustomId('select-task')
                    .setPlaceholder('Choose the task')
                    .addOptions(...optionBuilders)
                    .setRequired(false)


            )
        const textInput = new LabelBuilder()
            .setLabel('Task')
            .setTextInputComponent(
                new TextInputBuilder()
                    .setCustomId('input-task')
                    .setPlaceholder('What\'s your task?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            )

        modal.addLabelComponents([textInput, selectTaskMenu]);

        return modal;
    }
}
