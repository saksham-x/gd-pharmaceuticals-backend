import { Schema, model } from 'mongoose';
import { TASK_PRIORITIES, type ITask, type TaskModel } from './task.types.js';

const taskSchema = new Schema<ITask, TaskModel>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    dueDate: { type: Date, default: null },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'Normal' },
    done: { type: Boolean, default: false },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    enquiry: { type: Schema.Types.ObjectId, ref: 'Enquiry', default: null },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, versionKey: false },
);

taskSchema.index({ done: 1, dueDate: 1 });

export const Task = model<ITask, TaskModel>('Task', taskSchema);
