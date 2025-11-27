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
            "`/checklist create [type]` → Create a new checklist",
            "`/checklist view [type]` → Show today's checklist, interact with buttons to CRUD tasks",
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
                 "Use `/checklist view [type]` anytime to refresh progress.",
          inline: false
        }
      )
      .setFooter({ text: "Made with ❤️ by therealwan" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
