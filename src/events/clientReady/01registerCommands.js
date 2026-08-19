import getLocalCommands from '../../utils/getLocalCommands.js';
import getApplicationCommands from '../../utils/getApplicationCommands.js';
import areCommandsDifferent from '../../utils/areCommandsDifferent.js';


export default async (client) => {
  try {
    const localCommands = await getLocalCommands();
    const guildIds = process.env.GUILD_ID ? JSON.parse(process.env.GUILD_ID) : [];

    for (const guildId of guildIds) {
      const applicationCommands = await getApplicationCommands(client, guildId);

      for (const localCommand of localCommands) {
        const commandData = localCommand.data.toJSON();
        const existingCommand = await applicationCommands.cache.find(
          (cmd) => cmd.name === commandData.name
        );

        if (existingCommand) {
          if (localCommand.deleted) {
            await applicationCommands.delete(existingCommand.id);
            console.log(`Deleted command "${commandData.name}".`);
            continue;
          }

          if (areCommandsDifferent(existingCommand, commandData)) {
            await applicationCommands.edit(existingCommand.id, {
              description: commandData.description,
              options: commandData.options,
            })
            console.log(`Edited command "${commandData.name}".`);
          }
        }
        else {
          if (localCommand.deleted) {
            console.log(`Skipping registering local command "${commandData.name}" as it's set to delete.`);
            continue;
          }

          await applicationCommands.create(commandData);

          console.log(`Registered command "${commandData.name}".`);
        }
      }
    }


    console.log('Slash commands were registered successfully!');
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
};
