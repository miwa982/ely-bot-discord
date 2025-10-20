import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import EventSchema from "../db/Event/eventSchema.js";

const DAY_IN_SECONDS = 86_400;
export default {
    data: new SlashCommandBuilder()
        .setName("event")
        .setDescription("Manage events")
        .addSubcommand(sub =>
            sub.setName("register")
                .setDescription("Register a new event")
                .addStringOption(opt =>
                    opt.setName("title").setDescription("Event title").setRequired(true))
                .addStringOption(opt =>
                    opt.setName("type")
                        .setDescription("Schedule type")
                        .addChoices(
                            { name: "Linear (start/end)", value: "linear" },
                            { name: "Interval (every X days)", value: "interval" }
                        )
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName("start")
                        .setDescription("Start date/time (YYYY-MM-DD HH:mm)")
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName("end")
                        .setDescription("End date/time")
                        .setRequired(false))
                .addIntegerOption(opt =>
                    opt.setName("interval")
                        .setDescription("Repeat every X days (interval only)")
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName("description")
                        .setDescription("Event description")
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName("event_start")
                        .setDescription("Triggered when event start")
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName("event_remind")
                        .setDescription("Triggered when event remind")
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName("event_end")
                        .setDescription("Triggered when event end")
                        .setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName("view")
                .setDescription("View all events")),
    run: async ({ interaction, client }) => {
        const sub = interaction.options.getSubcommand();
        if (sub === "register") return registerEvent(interaction);
        if (sub === "view") return viewEvent(interaction);
    }
}

export async function registerEvent(interaction) {
    const title = interaction.options.getString("title");
    const type = interaction.options.getString("type");
    const start = interaction.options.getString("start");
    const end = interaction.options.getString("end");
    const interval = interaction.options.getInteger("interval");
    const description = interaction.options.getString("description");
    const event_start = interaction.options.getString("event_start");
    const event_remind = interaction.options.getString("event_remind");
    const event_end = interaction.options.getString("event_end");

    // Convert input string to Date in UTC+7
    const startDate = new Date(start.replace(" ", "T") + ":00+07:00");
    const endDate = end ? new Date(end.replace(" ", "T") + ":00+07:00") : null;

    const event = await EventSchema.create({
        title,
        channelId: interaction.channelId,
        scheduleType: type,
        startDate,
        endDate,
        interval,
        description,
        event_start,
        event_remind,
        event_end,
    });

    await interaction.reply(`✅ Event **${title}** registered!`);
}

export async function viewEvent(interaction) {
    const events = await EventSchema.find();
    // if (!events.length) return interaction.reply("No events found.");

    let reply = events
        .map(
            (ev, index) =>
                `${index+1}.**${ev.title}** (${ev.scheduleType})\nStart: <t:${Math.floor(
                    ev.startDate.getTime() / 1000
                )}:F>${ev.endDate ? `\nEnd: <t:${Math.floor(ev.endDate.getTime() / 1000)}:F>` : ""}`
        )
        .join("\n\n");
    const embed = new EmbedBuilder()
        .setTitle("Events")
        .setThumbnail("https://static.wikia.nocookie.net/honkaiimpact3_gamepedia_en/images/c/c5/Miss_Pink_Elf%E2%99%AA_Chibi.png")
        .setColor(0xec82b0)
        .setDescription(
            reply && reply.length > 0 ? reply : "✨ No event yet. Use `/event register` to add one!"
        )
        .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
}


