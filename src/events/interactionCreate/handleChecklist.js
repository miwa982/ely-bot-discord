const eventList = [
    { name: "Infinity Abyss", value: `hi3abyss` },
    { name: "Elysian Realm", value: `hi3er` },
    { name: "Memorial Arena", value: `hi3ma` },
    { name: "Spiral Abyss", value: `giabyss` },
    { name: "Imaginarium Theater", value: `githeater` },
    { name: "Stygian Onslaught", value: `giso` },
    { name: "Weekly Bosses - GI", value: `giweeklybosses` },
    { name: "Memory of Chaos", value: `hsrmoc` },
    { name: "Pure Fiction", value: `hsrpf` },
    { name: "Apocalypse Shadow", value: `hsras` },
    { name: "Simulated/Divergent Universe", value: `hsrsudu` },
    { name: "Weekly Bosses - HSR", value: `hsrweeklybosses` },
    { name: "Material Farming", value: `farm` },
]

export default async (interaction) => {
    if (!interaction.isAutocomplete()) return;

    if (interaction.commandName === "task" && interaction.options.getFocused(true).name === "name") {
        const focused = interaction.options.getFocused();

        // Filter eventList by user typing
        const filtered = eventList.filter(choice =>
            choice.name.toLowerCase().includes(focused.toLowerCase())
        );

        await interaction.respond(
            filtered.map(choice => ({ name: choice.name, value: choice.value }))
        );
    }
}