import {
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
    LabelBuilder
} from 'discord.js';

export default {
    build: async (type) => {
        //fetch checklist data here
        const eventList = [
            { name: "HI3 Infinity Abyss", value: `HI3 Infinity Abyss` },
            { name: "HI3 Elysian Realm", value: `HI3 Elysian Realm` },
            { name: "HI3 Memorial Arena", value: `HI3 Memorial Arena` },
            { name: "GI Spiral Abyss", value: `GI Spiral Abyss` },
            { name: "GI Imaginarium Theater", value: `GI Imaginarium Theater` },
            { name: "GI Stygian Onslaught", value: `GI Stygian Onslaught` },
            { name: "GI Weekly Bosses", value: `GI Weekly Bosses` },
            { name: "GI Memory of Chaos", value: `GI Memory of Chaos` },
            { name: "HSR Pure Fiction", value: `HSR Pure Fiction` },
            { name: "HSR Apocalypse Shadow", value: `HSR Apocalypse Shadow` },
            { name: "HSR Simulated/Divergent/Currency", value: `HSR Simulated/Divergent/Currency` },
            { name: "HSR Weekly Bosses", value: `HSR Weekly Bosses` },
            { name: "Material Farming", value: `Material Farming` },
        ]

        const tasks = eventList; // ← array of TaskSchema objects

        // Convert each task into a Discord option
        const optionBuilders = tasks.map(task =>
            new StringSelectMenuOptionBuilder()
                .setLabel(task.name)
                .setValue(task.value)
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