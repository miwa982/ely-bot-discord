import {Schema, model} from 'mongoose';
import enumData from '../../enum/enumData.js';

let TaskSchema = new Schema({
    checklistId: String,
    title: String,
    status: {
        type: String,
        default: enumData.TaskStatusType.TODO.code
    }
});

export default model('TaskSchema231202', TaskSchema);