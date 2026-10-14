import type { Request, Response } from 'express';
import type { QueryFilter } from 'mongoose';
import type { NoParams } from '../../types/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { escapeRegex } from '../../utils/text.js';
import { PERMISSION_RESOURCES } from '../role/role.permissions.js';
import { ActivityLog } from './activityLog.model.js';
import type { ListActivityLogsQuery } from './activityLog.schema.js';
import {
  ACTIVITY_ACTIONS,
  type ActivityLogFiltersResponse,
  type ActivityLogListResponse,
  type IActivityLog,
} from './activityLog.types.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** GET /api/activity-logs — newest first, one page at a time. */
export const listActivityLogs = asyncHandler(
  async (
    req: Request<NoParams, ActivityLogListResponse, unknown, ListActivityLogsQuery>,
    res: Response<ActivityLogListResponse>,
  ) => {
    const { page, limit, search, actor, resource, action, from, to } = req.query;
    const filter: QueryFilter<IActivityLog> = {};

    if (actor) filter.actor = actor;
    if (resource) filter.resource = resource;
    if (action) filter.action = action;
    if (from || to) {
      filter.createdAt = {
        ...(from && { $gte: from }),
        // `to` is a whole day: include everything up to its midnight.
        ...(to && { $lt: new Date(to.getTime() + DAY_MS) }),
      };
    }
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ actorName: pattern }, { actorEmail: pattern }, { targetLabel: pattern }];
    }

    const [items, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  },
);

/** GET /api/activity-logs/filters — options for the page's dropdowns. */
export const getActivityLogFilters = asyncHandler(
  async (_req: Request<NoParams>, res: Response<ActivityLogFiltersResponse>) => {
    // The latest name and email each admin appears under.
    const actors = await ActivityLog.aggregate<{ _id: string; name: string; email: string }>([
      { $match: { actor: { $ne: null } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$actor', name: { $first: '$actorName' }, email: { $first: '$actorEmail' } } },
      { $sort: { name: 1 } },
    ]);

    res.json({
      actors: actors.map((actor) => ({ id: String(actor._id), name: actor.name, email: actor.email })),
      resources: [
        { key: 'auth', label: 'Login' },
        ...PERMISSION_RESOURCES.filter((resource) => resource.key !== 'activityLogs' && resource.key !== 'dashboard').map(
          ({ key, label }) => ({ key, label }),
        ),
      ],
      actions: ACTIVITY_ACTIONS,
    });
  },
);
