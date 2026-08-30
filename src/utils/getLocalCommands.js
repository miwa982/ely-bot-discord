import { fileURLToPath, pathToFileURL } from 'url';
import path, { dirname } from 'path';
import getAllFiles from './getAllFiles.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async (exceptions = []) => {
    const localCommands = [];
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = [];
    const pendingDirectories = [commandsPath];

    while (pendingDirectories.length > 0) {
        const currentDirectory = pendingDirectories.pop();
        commandFiles.push(...getAllFiles(currentDirectory));
        pendingDirectories.push(...getAllFiles(currentDirectory, true));
    }

    commandFiles.sort();

    for (const commandFile of commandFiles) {
        const { default: commandObject } = await import(pathToFileURL(commandFile).href);
        const commandName = commandObject?.data?.name ?? commandObject?.name;

        if (!commandObject?.data || exceptions.includes(commandName)) {
            continue;
        }

        localCommands.push(commandObject);
    }

    return localCommands;
}
