const eventList = [
    { name: "HI3 Infinity Abyss", value: `hi3abyss` },
    { name: "HI3 Elysian Realm", value: `hi3er` },
    { name: "HI3 Memorial Arena", value: `hi3ma` },
    { name: "GI Spiral Abyss", value: `giabyss` },
    { name: "GI Imaginarium Theater", value: `githeater` },
    { name: "GI Stygian Onslaught", value: `giso` },
    { name: "GI Weekly Bosses", value: `giweeklybosses` },
    { name: "HSR Memory of Chaos", value: `hsrmoc` },
    { name: "HSR Pure Fiction", value: `hsrpf` },
    { name: "HSR Apocalypse Shadow", value: `hsras` },
    { name: "HSR Simulated/Divergent/Currency", value: `hsrsuducw` },
    { name: "HSR Weekly Bosses", value: `hsrweeklybosses` },
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