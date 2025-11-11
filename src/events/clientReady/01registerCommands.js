import { REST, Routes } from 'discord.js';
import getLocalCommands from '../../utils/getLocalCommands.js';
import getApplicationCommands from '../../utils/getApplicationCommands.js';


export default async (client) => {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    const localCommands = getLocalCommands();
    const guildIds = process.env.GUILD_ID ? JSON.parse(process.env.GUILD_ID) : [];

    await guildIds.forEach(async (guildId) => {
      const applicationCommands = await getApplicationCommands(client, guildId);
      const { name, description, options } = localCommands;
      for (const localCommand of localCommands) {
        const existingCommand = await applicationCommands.cache.find(
          (cmd) => cmd.name === name
        );
        if (existingCommand) {
          if (localCommand.deleted) {
            await applicationCommands.delete(existingCommand.id);
            console.log(`Deleted command "${name}".`);
            continue;
          }

          if (areCommandDifferent(existingCommand, localCommand)) {
            await applicationCommands.edit(existingCommand.id, {
              description,
              options
            })
            console.log(`Edited command "${name}".`);
          }
        }
        else {
          if (localCommand.deleted) {
            console.log(`Skipping registering local command "${name}" as it's set to delete.`);
            continue;
          }

          await applicationCommands.create({
            name, description, options
          });

          console.log(`Registered command "${name}".`);

          await rest.put(
            Routes.applicationGuildCommands(
              process.env.CLIENT_ID,
              guildId
            ),
            { body: localCommand }
          );
        }
      }
    })


    console.log('Slash commands were registered successfully!');
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
};