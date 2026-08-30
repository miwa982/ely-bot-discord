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
          name: "🎮 Daily Commission Commands",
          value: [
            "`/daily send` → Post today's interactive daily check-in poll",
            "`/daily check [game] (user)` → Check in a member (or yourself) for a game",
            "`/daily uncheck [game] (user)` → Remove check-in for a member (or yourself)",
            "`Right-click User → Apps → Daily Check-in` → Interactive game check-in menu for a member",
          ].join("\n"),
          inline: false
        },
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
          name: "🌸 Event & Schedule Commands",
          value: [
            "`/event dashboard` → Open interactive event dashboard with presets and manager",
            "`/event create` → Open modal to create custom weekly/interval/one-time game events",
            "`/event list` → View active and upcoming game events and timers",
          ].join("\n"),
          inline: false
        },
        {
          name: "⚙️ Server Configuration Commands",
          value: [
            "`/config set-channel [type] [channel]` → Set notification channel for daily/birthday/event/checklist",
            "`/config view` → View current channel settings for this server",
            "`/config reset [type]` → Reset channel assignment back to server default",
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
