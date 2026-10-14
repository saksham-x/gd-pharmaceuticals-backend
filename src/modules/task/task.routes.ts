import { Router } from 'express';
import { can } from '../../middleware/auth.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { createTask, deleteTask, listTasks, toggleTaskDone, updateTask } from './task.controller.js';
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from './task.schema.js';

export const taskRouter = Router();

taskRouter
  .route('/')
  .get(can('tasks', 'view'), validateQuery(listTasksQuerySchema), listTasks)
  .post(can('tasks', 'create'), validate(createTaskSchema), createTask);

taskRouter
  .route('/:id')
  .put(can('tasks', 'update'), validate(updateTaskSchema), updateTask)
  .delete(can('tasks', 'delete'), deleteTask);

taskRouter.put('/:id/done', can('tasks', 'update'), toggleTaskDone);
