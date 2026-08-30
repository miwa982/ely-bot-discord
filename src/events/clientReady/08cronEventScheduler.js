import { startEventScheduler } from "../../features/event/eventScheduler.js";

export default (client) => {
  startEventScheduler(client);
};
