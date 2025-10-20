import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available commands and how to use them"),
    
  run: async ({ interaction, client, handle }) => {
    const embed = new EmbedBuilder()
      .setTitle("📖 Ely Bot Help")
      .setAuthor({ name: "Ely", iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png" })
      .setDescription("Hehe~ Let me show you how to use me 🎶")
      .setColor(0xec82b0)
      .addFields(
        {
          name: "📌 Checklist Commands",
          value: [
            "`/checklist create [title] [description]` → Create a new checklist",
            "`/checklist view` → Show today's checklist",
            "`/checklist remove` → Remove today's checklist"
          ].join("\n"),
          inline: false
        },
        {
          name: "📝 Task Commands",
          value: [
            "`/task add <name>` → Add a new task",
            "`/task edit <task_number> [title] [status]` → Edit a task",
            "`/task remove <task_number>` → Remove a task"
          ].join("\n"),
          inline: false
        },
        {
          name: "📝 Remind Commands",
          value: [
            "`/remind [message] [time] → Set a reminder for the future (time: When to remind (e.g., 10m, 2h, 1d or exact time format YYYY-MM-DD hh:mm))`"
          ].join("\n"),
          inline: false
        },
        {
          name: "💡 Tips",
          value: "You can mark tasks as `TODO 👀`, `IN PROGRESS ⌛`, or `DONE ✅`.\n" +
                 "Use `/checklist view` anytime to refresh progress.",
          inline: false
        }
      )
      .setFooter({ text: "Made with ❤️ by therealwan" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
