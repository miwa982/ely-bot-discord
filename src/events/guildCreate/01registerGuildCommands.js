import { registerCommandsForGuild } from "../clientReady/01registerCommands.js";

export default async (guild, client) => {
  console.log(`Bot joined new guild: ${guild.name} (${guild.id}). Registering slash commands...`);
  await registerCommandsForGuild(client, guild.id);
};
