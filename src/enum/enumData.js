export default {
    ChecklistType: {
        DAILY: { name: 'DAILY', code: 'daily' },
        WEEKLY: { name: 'WEEKLY', code: 'weekly' },
    },
    TaskStatusType: {
        TODO: { name: "TODO", code: 'TODO' },
        IN_PROGRESS: { name: "IN_PROGRESS", code: 'IN_PROGRESS' },
        DONE: { name: "DONE", code: 'DONE' },
    },
    TaskStatusTypeUI: {
        TODO: { name: "TODO 👀", code: 'TODO' },
        IN_PROGRESS: { name: "IN PROGRESS... ⌛", code: 'IN_PROGRESS' },
        DONE: { name: "DONE ✅", code: 'DONE' },
    },
    ChecklistStatus: {
        RESET: { name: 'RESET', value: 'reset', icon: '🔄' },
        NOT_RESET: { name: 'NOT_RESET', value: 'not_reset', icon: '🚫🔄' },
        RESET_STATUS: { name: 'RESET_STATUS', value: 'reset_status', icon: '🧹' },
        NOT_RESET_STATUS: { name: 'NOT_RESET_STATUS', value: 'not_reset_status', icon: '🚫🧹' },
    }
}