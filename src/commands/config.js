import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { BOT_CONFIG, DISCORD_FLAGS } from "../constants/bot.js";
import {
  getGuildConfig,
  resetGuildChannel,
  resolveGuildChannel,
  setGuildChannel,
} from "../utils/guildConfig.js";

const CHANNEL_TYPE_CHOICES = [
  { name: "🌟 All Bot Features & Notifications", value: "all" },
  { name: "🎮 Daily Hoyoverse Commissions", value: "daily" },
  { name: "🎂 Birthday Celebrations", value: "birthday" },
  { name: "🌸 Game Events & Recurring Schedules", value: "event" },
  { name: "📌 Daily & Weekly Task Checklists", value: "checklist" },
];

export default {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure bot notification channels for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("set-channel")
        .setDescription("Assign a channel for bot notifications")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("The feature/notification type to assign")
            .setRequired(true)
            .addChoices(...CHANNEL_TYPE_CHOICES),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The text channel to send notifications to")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("View currently configured channels for this server"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("reset")
        .setDescription("Reset channel settings to defaults for this server")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("The feature/notification type to reset")
            .setRequired(true)
            .addChoices(...CHANNEL_TYPE_CHOICES),
        ),
    ),

  run: async ({ interaction, client }) => {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: "❌ This command can only be used inside a server.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "❌ You need **Manage Server** permissions to configure channels.",
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (subcommand === "set-channel") {
      const type = interaction.options.getString("type");
      const channel = interaction.options.getChannel("channel");

      await setGuildChannel(guildId, type, channel.id);

      const typeLabel =
        CHANNEL_TYPE_CHOICES.find((c) => c.value === type)?.name || type;

      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Elysia Server Config",
          iconURL: "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
        })
        .setTitle("✅ Channel Configured!")
        .setColor(BOT_CONFIG.EMBED_COLOR)
        .setDescription(
          `**Feature:** ${typeLabel}\n**Assigned Channel:** <#${channel.id}>`,
        )
        .setThumbnail("https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif")
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
      });
    }

    if (subcommand === "reset") {
      const type = interaction.options.getString("type");
      await resetGuildChannel(guildId, type);

      const typeLabel =
        CHANNEL_TYPE_CHOICES.find((c) => c.value === type)?.name || type;

      return interaction.reply({
        content: `✅ Reset channel configuration for **${typeLabel}**. Notifications will fallback to the server default.`,
        flags: DISCORD_FLAGS.EPHEMERAL,
      });
    }

    if (subcommand === "view") {
      const config = await getGuildConfig(guildId);
      const guild = interaction.guild;

      const resolvedDaily = await resolveGuildChannel(guild, "daily", client);
      const resolvedBirthday = await resolveGuildChannel(guild, "birthday", client);
      const resolvedEvent = await resolveGuildChannel(guild, "event", client);
      const resolvedChecklist = await resolveGuildChannel(guild, "checklist", client);

      const formatChannel = (configuredId, resolvedChannel) => {
        if (configuredId) {
          return `<#${configuredId}> *(Configured)*`;
        }
        if (resolvedChannel) {
          return `<#${resolvedChannel.id}> *(Default Fallback)*`;
        }
        return "⚠️ *None found (Check bot permissions)*";
      };

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${guild.name} — Channel Settings`,
          iconURL: guild.iconURL({ dynamic: true }) || "https://media.tenor.com/i-sN2NvSTEYAAAAe/elysia.png",
        })
        .setTitle("⚙️ Server Notification Channels")
        .setColor(BOT_CONFIG.EMBED_COLOR)
        .setDescription("Channels where Elysia will automatically send notifications:")
        .addFields(
          {
            name: "🎮 Daily Hoyoverse Commissions",
            value: formatChannel(config?.dailyChannelId, resolvedDaily),
            inline: false,
          },
          {
            name: "🎂 Birthday Celebrations",
            value: formatChannel(config?.birthdayChannelId, resolvedBirthday),
            inline: false,
          },
          {
            name: "🌸 Game Events & Reminders",
            value: formatChannel(config?.eventChannelId, resolvedEvent),
            inline: false,
          },
          {
            name: "📌 Task Checklists",
            value: formatChannel(config?.checklistChannelId, resolvedChecklist),
            inline: false,
          },
        )
        .setFooter({ text: "Use /config set-channel to change any channel" })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
      });
    }
  },
};
