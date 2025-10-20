import {Schema, model} from 'mongoose';
import TaskStatusType from '../../enum/TaskStatusType.js';

let TaskSchema = new Schema({
    checklistId: String,
    title: String,
    status: {
        type: String,
        default: TaskStatusType.TODO
    }
});

export default model('TaskSchema231202', TaskSchema);

export class Task {
    constructor(id, name, description = "", type = EventGameType.DAILY, status) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description,
        this.status = status;
    }
    getContent() {
        return `## ${this.id}. ${this.name}
        ${this.description !== "" ? `- Description: **${this.description}**` : ``}
        - Category: **${this.type}**
        - Status: **${this.status}**`
    }
}