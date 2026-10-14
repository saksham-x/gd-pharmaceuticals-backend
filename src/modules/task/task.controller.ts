import type { Request, Response } from 'express';
import { isValidObjectId, type QueryFilter } from 'mongoose';
import { requireUser } from '../../middleware/auth.js';
import type { IdParams, MessageResponse, NoParams } from '../../types/http.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { Enquiry } from '../enquiry/enquiry.model.js';
import { User } from '../user/user.model.js';
import { Task } from './task.model.js';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from './task.schema.js';
import type { ITask, TaskDocument } from './task.types.js';

const POPULATE = [
  { path: 'assignee', select: 'name email' },
  { path: 'enquiry', select: 'reference name' },
];

async function findOrThrow(id: string): Promise<TaskDocument> {
  const task = isValidObjectId(id) ? await Task.findById(id) : null;
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

async function assertRefsExist(body: Partial<CreateTaskInput>): Promise<void> {
  if (body.assignee && !(await User.exists({ _id: body.assignee }))) {
    throw ApiError.badRequest('That staff member no longer exists');
  }
  if (body.enquiry && !(await Enquiry.exists({ _id: body.enquiry }))) {
    throw ApiError.badRequest('That enquiry no longer exists');
  }
}

/**
 * GET /api/tasks — open tasks soonest first (no due date last); done tasks
 * most recently finished first. `mine=true` keeps tasks assigned to the
 * signed-in account or to nobody.
 */
export const listTasks = asyncHandler(
  async (req: Request<NoParams, unknown, unknown, ListTasksQuery>, res: Response) => {
    const { status, mine } = req.query;
    const filter: QueryFilter<ITask> = {};

    if (status === 'open') filter.done = false;
    if (status === 'done') filter.done = true;
    if (mine) filter.assignee = { $in: [requireUser(req).id, null] };

    const tasks = await Task.find(filter).populate(POPULATE).sort(status === 'done' ? { updatedAt: -1 } : { dueDate: 1, createdAt: 1 });

    // MongoDB sorts null before dates; a task without a deadline belongs at the end.
    if (status !== 'done') {
      tasks.sort((a, b) => Number(a.dueDate === null) - Number(b.dueDate === null));
    }
    res.json(tasks);
  },
);

/** POST /api/tasks */
export const createTask = asyncHandler(async (req: Request<NoParams, unknown, CreateTaskInput>, res: Response) => {
  await assertRefsExist(req.body);
  const task = await Task.create({ ...req.body, createdBy: requireUser(req).id });
  res.status(201).json(await task.populate(POPULATE));
});

/** PUT /api/tasks/:id */
export const updateTask = asyncHandler(async (req: Request<IdParams, unknown, UpdateTaskInput>, res: Response) => {
  const task = await findOrThrow(req.params.id);
  await assertRefsExist(req.body);
  task.set(req.body);
  await task.save();
  res.json(await task.populate(POPULATE));
});

/** PUT /api/tasks/:id/done — tick or untick. */
export const toggleTaskDone = asyncHandler(async (req: Request<IdParams>, res: Response) => {
  const task = await findOrThrow(req.params.id);
  task.done = !task.done;
  await task.save();
  res.json(await task.populate(POPULATE));
});

/** DELETE /api/tasks/:id */
export const deleteTask = asyncHandler(async (req: Request<IdParams>, res: Response<MessageResponse>) => {
  const task = isValidObjectId(req.params.id) ? await Task.findByIdAndDelete(req.params.id) : null;
  if (!task) throw ApiError.notFound('Task not found');
  res.json({ message: 'Task deleted' });
});
