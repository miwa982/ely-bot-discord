import { TASK_SUGGESTIONS } from "../../constants/bot.js";

export default async (interaction) => {
    if (!interaction.isAutocomplete()) return;

    if (interaction.commandName === "task" && interaction.options.getFocused(true).name === "name") {
        const focused = interaction.options.getFocused();

        // Filter eventList by user typing
        const filtered = TASK_SUGGESTIONS.filter(choice =>
            choice.name.toLowerCase().includes(focused.toLowerCase())
        );

        await interaction.respond(
            filtered.map(choice => ({ name: choice.name, value: choice.value }))
        );
    }
}
