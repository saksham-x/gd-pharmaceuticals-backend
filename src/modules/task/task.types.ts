import type { HydratedDocument, Model, Types } from 'mongoose';

export const TASK_PRIORITIES = ['Normal', 'High'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** A staff follow-up, e.g. "Call Himal Trade Link". */
export interface ITask {
  title: string;
  /** Null for no deadline. */
  dueDate: Date | null;
  priority: TaskPriority;
  done: boolean;
  /** Null for anyone on the team. */
  assignee: Types.ObjectId | null;
  /** The enquiry this follows up, when there is one. */
  enquiry: Types.ObjectId | null;
  notes: string;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskDocument = HydratedDocument<ITask>;
export type TaskModel = Model<ITask>;
