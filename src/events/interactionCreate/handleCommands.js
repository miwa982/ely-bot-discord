import getLocalCommands from "../../utils/getLocalCommands.js";
import { DISCORD_FLAGS } from "../../constants/bot.js";


export default async (interaction, client) => {
  if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

  const localCommands = await getLocalCommands();
  const devs = process.env.DEV_ID ? [process.env.DEV_ID] : [];

  try {
    const commandObject = localCommands.find(
      (cmd) => cmd.data?.name === interaction.commandName || cmd.name === interaction.commandName
    );

    if (!commandObject) return;

    if (commandObject.devOnly) {
      if (!devs.includes(interaction.member.id)) {
        interaction.reply({
          content: 'Only developers are allowed to run this command.',
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
        return;
      }
    }

    if (commandObject.testOnly) {
      if (!(interaction.guild.id === process.env.TEST_GUILD_ID)) {
        interaction.reply({
          content: 'This command cannot be ran here.',
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
        return;
      }
    }

    if (commandObject.permissionsRequired?.length) {
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.member.permissions.has(permission)) {
          interaction.reply({
            content: 'Not enough permissions.',
            flags: DISCORD_FLAGS.EPHEMERAL,
          });
          return;
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me;

        if (!bot.permissions.has(permission)) {
          interaction.reply({
            content: "I don't have enough permissions.",
            flags: DISCORD_FLAGS.EPHEMERAL,
          });
          return;
        }
      }
    }

    const runCommand = commandObject.run ?? commandObject.callback;
    if (!runCommand) return;

    await runCommand({ client, interaction });
  } catch (error) {
    console.log(`There was an error running this command: ${error}`);
  }
};
