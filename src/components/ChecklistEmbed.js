import {
    EmbedBuilder
} from "discord.js";

import { BOT_CONFIG, CHECKLIST_TYPES, TASK_STATUS_UI } from "../constants/bot.js";

export class ChecklistEmbed {
    constructor(checklist, interaction) {
        this.checklist = checklist
        this.interaction = interaction
    }

    render() {
        const tasks = this.checklist.items ?? [];

        return new EmbedBuilder()
            .setTitle(`${this.checklist.title} (${this.checklist.type ?? CHECKLIST_TYPES.DAILY})`)
            .setAuthor({ name: this.interaction.user.tag, iconURL: this.interaction.user.avatarURL() })

            .setColor(BOT_CONFIG.EMBED_COLOR)
            .setDescription(
                tasks.length > 0
                    ? tasks.map((task, idx) => `**${idx + 1}.** ${task.title} — \`${TASK_STATUS_UI[task.status]?.name ?? task.status}\``).join("\n")
                    : `✨ No tasks yet. Click **"📋 Add"** button to add one!`
            )
            .setTimestamp();
    }



}
