import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import getAllFiles from '../utils/getAllFiles.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (exceptions) => {
    let localCommands = [];

    const commandCategories = getAllFiles(
        path.join(__dirname, '..', 'commands'), 
        true
    );

    for (const commandCategory of commandCategories) {
        const commandFiles = getAllFiles(commandCategory);

        for (const commandFile of commandFiles) {
            const commandObject = require(commandFile);

            if (exceptions.includes(commandObject.name)) {
                continue;
            }

            localCommands.push(commandObject);
        }
    }

    return localCommands;
}