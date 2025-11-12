import { SlashCommandBuilder, PollLayoutType } from 'discord.js';
import { getFormatedTodayDate } from '../utils/date.js';
import {Elysia} from '../utils/elysia.js';

const commandInfo = {
    name: "daily",
    description: "Hoyoverse daily commissions checklist",
};

async function sendDailyPoll(interaction, channel, client) {
    const giIcon = await client.application.emojis.fetch("1407766466459340900");
    const hsrIcon = await client.application.emojis.fetch("1407766457923796992");
    const hi3Icon = await client.application.emojis.fetch("1407766445978554379");
    const zzzIcon = await client.application.emojis.fetch("1407987904822771732");
    const wwIcon = await client.application.emojis.fetch("1407987893087113277");
    const options = [
                { text: `Genshin Impact`, emoji: giIcon },
                { text: `Honkai: Star Rail`, emoji: hsrIcon },
                { text: `Honkai Impact 3rd`, emoji: hi3Icon },
                { text: `Zenless Zone Zero`, emoji: zzzIcon },
                { text: `Wuthering Waves`, emoji: wwIcon },
    ];
    const mode = interaction ? interaction.options.getString("mode") : interaction;
    const setPollAnswers = (mode, options) => {
        if (!mode || mode === 'default') {
            return options.slice(0,3);
        }
        return options;

    }

    if (!channel) channel = interaction.channel;
    await channel.send({
        poll: {
            question: { text: `Daily commission (${getFormatedTodayDate()})` },
            answers: setPollAnswers(mode, options),
            allowMultiselect: true,
            duration: 24,
            layoutType: PollLayoutType.Default,
        }
    });
}

export default {
    data: new SlashCommandBuilder()
        .setName(commandInfo.name)
        .setDescription(commandInfo.description)
        .addStringOption(option =>
            option.setName("mode")
                .setDescription("Add more game to your dailies")
                .setRequired(false)
                .addChoices(
                    { name: "default", value: "default" },
                    { name: "all", value: "all" },
                )),
    run: async ({ interaction, client, handler }) => {
        const randomResponse = Elysia.daily_response();
        await interaction.reply(randomResponse);
        await sendDailyPoll(interaction, null, client);
    },
    options: {
        //  devOnly: true,
        //  userPermissions: ['Administrator'],
        //  botPermissions: ['BanMembers'],
        //  deleted: true,
    },
    sendDailyPoll
}
