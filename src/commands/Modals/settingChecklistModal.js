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
    build: async (type) => {

        const lstStatus = Object.values(enumData.ChecklistStatus).map(status => ({
            label: `${status.name} ${status.icon}`,
            value: status.value
        }));

        const optionStatusBuilders = lstStatus.map(status =>
            new StringSelectMenuOptionBuilder()
                .setLabel(status.label)
                .setValue(status.value)
        );

        const modal = new ModalBuilder().setCustomId(`setting-checklist-modal:${type}`)
            .setTitle('Checklist Settings')

        const selectStatusMenu = new LabelBuilder()
            .setLabel('Status')
            .setStringSelectMenuComponent(
                new StringSelectMenuBuilder()
                    .setCustomId('select-checklist-status')
                    .setPlaceholder('Choose the status')
                    .addOptions(...optionStatusBuilders)
                    .setRequired(true)
            )

        modal.addLabelComponents([selectStatusMenu]);

        return modal;
    }
}