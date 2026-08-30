import getLocalCommands from "../../utils/getLocalCommands.js";
import getApplicationCommands from "../../utils/getApplicationCommands.js";
import areCommandsDifferent from "../../utils/areCommandsDifferent.js";

export async function registerCommandsForGuild(client, guildId, localCommands = null) {
  try {
    const commands = localCommands || (await getLocalCommands());
    const applicationCommands = await getApplicationCommands(client, guildId);

    for (const localCommand of commands) {
      const commandData = localCommand.data.toJSON();
      const existingCommand = await applicationCommands.cache.find(
        (cmd) => cmd.name === commandData.name,
      );

      if (existingCommand) {
        if (localCommand.deleted) {
          await applicationCommands.delete(existingCommand.id);
          console.log(`Deleted command "${commandData.name}" in guild ${guildId}.`);
          continue;
        }

        if (areCommandsDifferent(existingCommand, commandData)) {
          await applicationCommands.edit(existingCommand.id, {
            description: commandData.description,
            options: commandData.options,
          });
          console.log(`Edited command "${commandData.name}" in guild ${guildId}.`);
        }
      } else {
        if (localCommand.deleted) {
          continue;
        }

        await applicationCommands.create(commandData);
        console.log(`Registered command "${commandData.name}" in guild ${guildId}.`);
      }
    }
  } catch (error) {
    console.error(`Error registering commands for guild ${guildId}:`, error);
  }
}

export default async (client) => {
  try {
    const localCommands = await getLocalCommands();

    // Dynamically detect all guilds the bot belongs to
    let guildIds = Array.from(client.guilds.cache.keys());

    // Optional legacy fallback if GUILD_ID is provided
    if (process.env.GUILD_ID) {
      try {
        const parsed = JSON.parse(process.env.GUILD_ID);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        guildIds = Array.from(new Set([...guildIds, ...list]));
      } catch {
        guildIds = Array.from(new Set([...guildIds, process.env.GUILD_ID]));
      }
    }

    for (const guildId of guildIds) {
      await registerCommandsForGuild(client, guildId, localCommands);
    }

    console.log(`Slash commands were registered successfully across ${guildIds.length} guild(s)!`);
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
};
