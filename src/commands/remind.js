import { SlashCommandBuilder } from "discord.js";
import { DISCORD_FLAGS } from "../constants/bot.js";
import ReminderSchema from "../db/Reminder/reminderSchema.js";

const commandInfo = {
    name: "remind",
    description: "Set a reminder for the future"
};

export default {
    data: new SlashCommandBuilder()
        .setName(commandInfo.name)
        .setDescription(commandInfo.description)
        .addStringOption(option =>
            option.setName("message")
                .setDescription("What do you want to be reminded about?")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("time")
                .setDescription("When to remind (e.g., 10m, 2h, 1d, or exact time like 2025-09-09 18:30)")
                .setRequired(true)
        ),
    run: async ({ interaction }) => {
        const message = interaction.options.getString("message");
        const timeInput = interaction.options.getString("time");

        // ⏳ Parse time
        let remindAt;
        if (/^\d+[smhd]$/.test(timeInput)) {
            // relative format: 10m, 2h, 1d
            const num = parseInt(timeInput.slice(0, -1));
            const unit = timeInput.slice(-1);
            let ms = 0;
            if (unit === "s") ms = num * 1000;
            if (unit === "m") ms = num * 60 * 1000;
            if (unit === "h") ms = num * 60 * 60 * 1000;
            if (unit === "d") ms = num * 24 * 60 * 60 * 1000;
            remindAt = new Date(Date.now() + ms);
        } else {
            // try parse absolute datetime
            remindAt = new Date(timeInput.replace(" ", "T") + ":00+07:00");

            if (isNaN(remindAt.getTime())) {
                return interaction.reply({ content: "❌ Invalid time format.", flags: DISCORD_FLAGS.EPHEMERAL });
            }
        }

        // 💾 Save reminder
        await ReminderSchema.create({
            userId: interaction.user.id,
            channelId: interaction.channel.id,
            message,
            remindAt,
        });

        await interaction.reply({
            content: `✅ I will remind you <t:${Math.floor(remindAt.getTime() / 1000)}:R>: "${message}"`,
            flags: DISCORD_FLAGS.EPHEMERAL
        });
    }
};
