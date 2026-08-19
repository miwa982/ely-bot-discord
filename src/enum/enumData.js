import {
  CHECKLIST_TYPES,
  TASK_STATUSES,
  TASK_STATUS_UI,
} from "../constants/bot.js";

export default {
  ChecklistType: {
    DAILY: { name: "DAILY", code: CHECKLIST_TYPES.DAILY },
    WEEKLY: { name: "WEEKLY", code: CHECKLIST_TYPES.WEEKLY },
  },
  TaskStatusType: {
    TODO: { name: "TODO", code: TASK_STATUSES.TODO },
    IN_PROGRESS: { name: "IN_PROGRESS", code: TASK_STATUSES.IN_PROGRESS },
    DONE: { name: "DONE", code: TASK_STATUSES.DONE },
  },
  TaskStatusTypeUI: TASK_STATUS_UI,
};
