import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import { BOT_CONFIG, DAILY_GAMES, DISCORD_FLAGS } from '../constants/bot.js';
import { getFormatedTodayDate } from '../utils/date.js';
import {Elysia} from '../utils/elysia.js';

const commandInfo = {
    name: "daily",
    description: "Hoyoverse daily commissions checklist",
};

const DAILY_BUTTON_PREFIX = "daily-toggle";
const mentionRegex = /<@!?(\d+)>/g;

async function getDailyGameOptions(client) {
    const games = DAILY_GAMES;
    const emojis = await Promise.all(
        games.map(async (game) => {
            try {
                return await client.application.emojis.fetch(game.emojiId);
            } catch (err) {
                console.error(`Failed to fetch daily emoji ${game.emojiId}:`, err);
                return null;
            }
        }),
    );

    return games.map((game, index) => ({
        ...game,
        emoji: emojis[index],
    }));
}

function getEmojiMarkup(game) {
    if (!game.emoji) return "";
    return game.emoji.animated
        ? `<a:${game.emoji.name}:${game.emoji.id}>`
        : `<:${game.emoji.name}:${game.emoji.id}>`;
}

function buildCompletionMap(games, sourceEmbed) {
    const completionMap = new Map(games.map((game) => [game.code, []]));
    if (!sourceEmbed?.fields) return completionMap;

    for (const game of games) {
        const field = sourceEmbed.fields.find((item) => item.name.includes(game.label));
        if (!field) continue;

        const userIds = [...field.value.matchAll(mentionRegex)].map((match) => match[1]);
        completionMap.set(game.code, [...new Set(userIds)]);
    }

    return completionMap;
}

function buildDailyEmbed(games, completionMap, title = `Daily commission (${getFormatedTodayDate()})`) {
    const completedCount = [...completionMap.values()].reduce((total, users) => total + users.length, 0);
    const activeGames = [...completionMap.values()].filter((users) => users.length > 0).length;
    const embed = new EmbedBuilder()
        .setAuthor({
            name: "Ely Daily Check-in",
            iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
        })
        .setTitle(title.replace("Daily commission", "Daily Commission"))
        .setColor(BOT_CONFIG.EMBED_COLOR)
        .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
        .setDescription([
            "Tap a game button below to check in. Tap again to undo.",
            "",
            `**Progress:** ${completedCount} check-in(s) across ${activeGames}/${games.length} game(s)`,
        ].join("\n"))
        .setFooter({ text: "Daily reset follows UTC+7" })
        .setTimestamp();

    for (const game of games) {
        const users = completionMap.get(game.code) ?? [];
        const emoji = getEmojiMarkup(game);
        embed.addFields({
            name: `${emoji} ${game.label}`.trim(),
            value: users.length > 0
                ? `✅ ${users.map((userId) => `<@${userId}>`).join(" ")}`
                : "▫️ No check-ins yet",
            inline: true,
        });
    }

    return embed;
}

function buildDailyComponents(games, completionMap) {
    return [
        new ActionRowBuilder().addComponents(
            games.map((game) => {
                const users = completionMap.get(game.code) ?? [];
                const button = new ButtonBuilder()
                    .setCustomId(`${DAILY_BUTTON_PREFIX}:${game.code}`)
                    .setLabel(String(users.length))
                    .setStyle(users.length > 0 ? ButtonStyle.Success : ButtonStyle.Secondary);

                if (game.emoji) {
                    button.setEmoji({ id: game.emoji.id, name: game.emoji.name });
                } else {
                    button.setLabel(`${game.code.toUpperCase()} ${users.length}`);
                }

                return button;
            }),
        ),
    ];
}

async function sendDailyPoll(interaction, channel, client, content = null) {
    if (interaction && !interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
    }

    const games = await getDailyGameOptions(client);
    const completionMap = buildCompletionMap(games);
    const payload = {
        content,
        embeds: [buildDailyEmbed(games, completionMap)],
        components: buildDailyComponents(games, completionMap),
    };

    if (!payload.content) delete payload.content;

    if (interaction) {
        return interaction.editReply(payload);
    }

    if (!channel) return;
    return channel.send(payload);
}

async function handleDailyButton(interaction, client) {
    if (!interaction.isButton() || !interaction.customId.startsWith(`${DAILY_BUTTON_PREFIX}:`)) {
        return false;
    }

    const selectedGameCode = interaction.customId.split(":")[1];
    const currentEmbed = interaction.message.embeds[0];
    const games = await getDailyGameOptions(client);
    const completionMap = buildCompletionMap(games, currentEmbed);
    const completedUsers = completionMap.get(selectedGameCode);

    if (!completedUsers) {
        await interaction.reply({
            content: "❌ Daily option not found.",
            flags: DISCORD_FLAGS.EPHEMERAL,
        });
        return true;
    }

    const userId = interaction.user.id;
    if (completedUsers.includes(userId)) {
        completionMap.set(
            selectedGameCode,
            completedUsers.filter((completedUserId) => completedUserId !== userId),
        );
    } else {
        completionMap.set(selectedGameCode, [...completedUsers, userId]);
    }

    await interaction.update({
        embeds: [buildDailyEmbed(games, completionMap, currentEmbed?.title)],
        components: buildDailyComponents(games, completionMap),
    });

    return true;
}

export default {
    data: new SlashCommandBuilder()
        .setName(commandInfo.name)
        .setDescription(commandInfo.description),
    run: async ({ interaction, client, handler }) => {
        const randomResponse = Elysia.daily_response();
        await sendDailyPoll(interaction, null, client, randomResponse);
    },
    options: {
        //  devOnly: true,
        //  userPermissions: ['Administrator'],
        //  botPermissions: ['BanMembers'],
        //  deleted: true,
    },
    sendDailyPoll,
    handleDailyButton
}
