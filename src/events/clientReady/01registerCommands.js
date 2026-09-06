export async function cleanGuildCommands(client, guildId) {
  try {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;

    const guildCommands = await guild.commands.fetch().catch(() => null);
    if (guildCommands && guildCommands.size > 0) {
      await guild.commands.set([]);
      console.log(
        `[Commands] Cleaned up ${guildCommands.size} guild command(s) in "${guild.name}" (${guildId}) to prevent duplicates.`,
      );
    }
  } catch (error) {
    console.error(`[Commands] Failed to clean guild commands for ${guildId}:`, error);
  }
}

// Backward-compatibility export
export async function registerCommandsForGuild(client, guildId) {
  await cleanGuildCommands(client, guildId);
}

export default async (client) => {
  try {
    // CommandKit automatically registers all slash and context menu commands globally.
    // Guild-scoped commands cause Discord to show duplicate entries in the slash picker and context menu.
    // Clean up guild commands across all guilds so only global commands remain.
    const guilds = await client.guilds.fetch();
    for (const [guildId] of guilds) {
      await cleanGuildCommands(client, guildId);
    }

    console.log(`[Commands] Verified clean guild commands across ${guilds.size} guild(s). Global commands are active.`);
  } catch (error) {
    console.error("[Commands] Error during guild command cleanup:", error);
  }
};
