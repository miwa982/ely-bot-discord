import {
    EmbedBuilder
} from "discord.js";

import enumData from "../enum/enumData.js"

export class ChecklistEmbed {
    constructor(checklist, interaction) {
        this.checklist = checklist
        this.interaction = interaction
    }

    taskStatusMap = {
        TODO: "TODO 👀",
        IN_PROGRESS: "IN PROGRESS... ⌛",
        DONE: "DONE ✅"
    };

    render() {
        return new EmbedBuilder()
            .setTitle(`${this.checklist.title} (${this.checklist.type ?? 'daily'})`)
            .setAuthor({ name: this.interaction.user.tag, iconURL: this.interaction.user.avatarURL() })

            .setColor(0xec82b0)
            .setDescription(
                this.checklist && this.checklist.length > 0 ?
                    this.checklist.map((task, idx) => `**${idx + 1}.** ${task.title} — \`${enumData.TaskStatusTypeUI[task.status] || task.status
                        }\``).join("\n")
                    : `✨ No tasks yet. Use \`/task add ${this.checklist.type === 'weekly' ? 'type:WEEKLY ' : ''}\`to add one!`
            )
            .setTimestamp();
    }



}