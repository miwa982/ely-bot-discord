import { cleanGuildCommands } from "../clientReady/01registerCommands.js";

export default async (guild, client) => {
  console.log(`[Guild] Bot joined new guild: ${guild.name} (${guild.id}). Ensuring no duplicate guild commands exist...`);
  await cleanGuildCommands(client, guild.id);
};
