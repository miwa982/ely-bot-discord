import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { BOT_CONFIG, DISCORD_FLAGS } from "../constants/bot.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available commands and how to use them"),
    
  run: async ({ interaction, client, handle }) => {
    const embed = new EmbedBuilder()
      .setTitle("🌸 Elysia Bot Guide & Command Center 🎶")
      .setAuthor({
        name: "Elysia — Miss Pink Elf♪",
        iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
      })
      .setDescription(
        "Hi~ Did you wake early just so you could see me sooner? Let me show you everything we can do together! ✨\n\n" +
          "*You can use slash commands `/` or right-click any user for interactive Apps!*",
      )
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
      .addFields(
        {
          name: "🎮 Daily Commission Checklist (03:00 UTC+7 Reset & Final Recap)",
          value: [
            "`/daily send` → Post today's interactive check-in poll in the daily channel",
            "`/daily recap` → View the finalized check-in report for all reminder subscribers",
            "`/daily check [game] (user)` → Check in a member (or yourself) for a game",
            "`/daily uncheck [game] (user)` → Remove check-in for a member (or yourself)",
            "`Right-click User → Apps → Daily Check-in` → Interactive popup to check in games for a member",
            "✨ *Interactive Poll Buttons:* Click any game button on the message to toggle check-in instantly!",
            "🌟 *One-Tap Check-in:* Click **`[🌟 Check My Games]`** to check in all your registered games at once!",
            "🌸 *03:00 AM Finalized Recap Embed:* Before each new cycle begins, Elysia posts a pretty report listing every reminder subscriber's check-in results!",
            "⏰ *Valid all night until 03:00 AM UTC+7* matching Hoyoverse server reset.",
            "🎮 *Supported Games:* Genshin Impact, Honkai: Star Rail, Honkai Impact 3rd, Zenless Zone Zero, Wuthering Waves, and Miliastra Wonderland!",
          ].join("\n"),
          inline: false,
        },
        {
          name: "⏰ Check-in Reminders (Customizable Ping Time & Games)",
          value: [
            "`Right-click User → Apps → Reminder Settings` → **(Recommended)** Interactive panel to pick games AND your custom ping hour!",
            "`/checkin-reminder settings (user)` → Open the interactive settings panel",
            "`/checkin-reminder subscribe (user) (hour) (games)` → Subscribe with custom hour (0-23 UTC+7, default 18:00) and game list",
            "`/checkin-reminder unsubscribe (user)` → Stop daily check-in reminders for yourself or others",
            "`/checkin-reminder status (user)` → Check active reminder status, ping time & registered games",
            "🎯 *Zero Spam:* Reminders only ping at your configured hour if your registered games are still incomplete!",
          ].join("\n"),
          inline: false,
        },
        {
          name: "🌸 Game Events & Permanent Schedules",
          value: [
            "`/event dashboard` → Open interactive event manager (`Add`, `Quick Presets`, `Edit`, `Delete`)",
            "`/event list` → View clean public timetable of active & upcoming game events",
            "`/event create` → Open modal to create custom weekly/interval/one-time game events",
            "`/event edit` → Select and edit an existing event (title, schedule, reminders, notes)",
            "✨ *Dashboard Buttons:* `[➕ Add Event]`, `[⚡ Quick Presets]`, `[✏️ Edit Event]`, `[🗑️ Delete Event]`, `[🔄 Refresh]`",
            "🔁 *Permanent Rollover:* Weekly and interval events automatically roll over forever!",
          ].join("\n"),
          inline: false,
        },
        {
          name: "📌 Task Checklists",
          value: [
            "`/checklist create [type]` → Create a new daily or weekly checklist",
            "`/checklist view [type]` → View checklist with interactive task management",
            "✨ *Interactive Buttons:* Click buttons to Add Task, Edit Task, Remove Task, or toggle status (`TODO 👀`, `IN PROGRESS ⌛`, `DONE ✅`)",
          ].join("\n"),
          inline: false,
        },
        {
          name: "🎂 Birthday Celebrations (07:00 UTC+7)",
          value: [
            "`/birthday set [month] [day] (user)` → Register your or a member's birthday",
            "`/birthday view (user)` → View birthday date and countdown",
            "`/birthday list` → List upcoming birthdays in this server",
            "`/birthday remove (user)` → Remove a registered birthday",
            "🎉 *Elysia's Birthday:* Celebrated on November 11 (*17 candles♪*)!",
          ].join("\n"),
          inline: false,
        },
        {
          name: "⚙️ Server Configuration (Manage Server)",
          value: [
            "`/config set-channel [type] [channel]` → Assign notification channel (`all`, `daily`, `birthday`, `event`, `checklist`)",
            "`/config view` → View current channel settings & active fallback channels",
            "`/config reset [type]` → Reset channel assignment back to server default",
          ].join("\n"),
          inline: false,
        },
        {
          name: "📝 Personal Reminders",
          value: [
            "`/remind [message] [time]` → Set a personal reminder (e.g., `10m`, `2h`, `1d`, or `YYYY-MM-DD HH:mm`)",
          ].join("\n"),
          inline: false,
        },
      )
      .setFooter({ text: "Made with ❤️ for Elysia lovers • By therealwan" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: DISCORD_FLAGS.EPHEMERAL });
  }
};
