import { z } from 'zod';
import {
  atLeastOneField,
  atLeastOneFieldError,
  nullableDateInput,
  objectId,
  optionalText,
  requiredString,
} from '../../utils/zod.js';
import { TASK_PRIORITIES } from './task.types.js';

/** Blank or null clears the reference. */
const optionalRef = (label: string) => z.preprocess((value) => (value === '' ? null : value), objectId(label).nullable());

const fields = {
  title: requiredString('Title', 200),
  dueDate: nullableDateInput('Due date'),
  priority: z.enum(TASK_PRIORITIES, { error: 'Priority must be Normal or High' }),
  done: z.boolean(),
  assignee: optionalRef('Assignee'),
  enquiry: optionalRef('Enquiry'),
  notes: optionalText(3000),
};

export const createTaskSchema = z.object(fields).partial().required({ title: true });

export const updateTaskSchema = z.object(fields).partial().refine(atLeastOneField, atLeastOneFieldError);

/** GET /api/tasks?status=open|done|all&mine=true */
export const listTasksQuerySchema = z.object({
  status: z.enum(['open', 'done', 'all']).default('open'),
  mine: z.preprocess((value) => value === 'true', z.boolean()).default(false),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
