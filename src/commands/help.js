import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { BOT_CONFIG, DISCORD_FLAGS } from "../constants/bot.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available commands and how to use them"),
    
  run: async ({ interaction, client, handle }) => {
    const embed = new EmbedBuilder()
      .setTitle("📖 Ely Bot Help")
      .setAuthor({ name: "Ely", iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png" })
      .setDescription("Hehe~ Let me show you how to use me 🎶")
      .setColor(BOT_CONFIG.EMBED_COLOR)
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
            "`/remind [message] [time] → Set a reminder for the future (time: When to remind (e.g., 10m, 2h, 1d or exact time format YYYY-MM-DD hh:mm))`",
            "`/checkin-reminder subscribe → Get pinged at 18:00 for daily check-in`",
            "`/checkin-reminder unsubscribe → Stop the daily check-in ping`",
          ].join("\n"),
          inline: false
        },
        {
          name: "🎂 Birthday Commands",
          value: [
            "`/birthday set [month] [day] (user)` → Set your birthday (or another member's if admin)",
            "`/birthday view (user)` → View your or a member's birthday countdown",
            "`/birthday list` → List upcoming birthdays in this server",
            "`/birthday remove (user)` → Remove birthday entry",
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

    await interaction.reply({ embeds: [embed], flags: DISCORD_FLAGS.EPHEMERAL });
  }
};
