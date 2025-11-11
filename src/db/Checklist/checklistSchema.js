import { Schema, model } from 'mongoose';

let ChecklistSchema = new Schema({
    title: String,
    description: String,
    ownerName: String,
    type: String,
    items: [{ type: Schema.Types.ObjectId, ref: "TaskSchema231202" }],

    //For live updates
    lastMessageId: { type: String, default: null },
    channelId: { type: String, default: null },
    
}, { timestamps: true });

export default model('ChecklistSchema231202', ChecklistSchema);
