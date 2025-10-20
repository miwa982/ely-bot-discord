import { fileURLToPath, pathToFileURL } from "url";
import path, { dirname } from "path";
import getAllFiles from "../utils/getAllFiles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (client) => {
  const eventFolders = getAllFiles(path.join(__dirname, "..", "events"), true);

  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder);
    eventFiles.sort((a, b) => a > b);

    const eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

    client.on(eventName, async (...args) => {
      for (const eventFile of eventFiles) {
        const fileUrl = pathToFileURL(eventFile).href;
        const module = await import(fileUrl);

        const eventFunction =
          module.default || Object.values(module).find((exp) => typeof exp === "function");

        if (!eventFunction) {
          console.warn(`⚠️ No function export found in ${eventFile}`);
          continue;
        }

        await eventFunction(client, ...args);
      }
    });
  }
};
