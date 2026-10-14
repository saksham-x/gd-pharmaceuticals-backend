import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request, RequestHandler, Response } from 'express';
import type { Schema } from 'mongoose';
import { ActivityLog } from './activityLog.model.js';
import type { ActivityAction } from './activityLog.types.js';

/**
 * Writes the audit trail. Routes never call this directly: `can(resource,
 * action)` in middleware/auth.ts adds `recordActivity` to every create,
 * update and delete route, and the login controller calls `recordLogin`.
 */

interface ActivityStore {
  /** What the handler sent back — the created or updated record. */
  body?: unknown;
  /** The first record the handler deleted, captured by `captureDeletedPlugin`. */
  deleted?: unknown;
}

const context = new AsyncLocalStorage<ActivityStore>();

// ----------------------------------------------------------------------------
// Keeping the log readable and safe
// ----------------------------------------------------------------------------

const SECRET_KEY = /password|token|secret/i;
const SKIPPED_KEYS = new Set(['_id', '__v', 'createdAt', 'updatedAt']);
const MAX_STRING = 300;
const MAX_ARRAY = 20;
const MAX_DEPTH = 4;

/** The request body as it goes into the log: no secrets, no pages of HTML. */
function sanitize(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}… (${value.length} characters)` : value;
  }
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '…';

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY).map((item) => sanitize(item, depth + 1));
    return value.length > MAX_ARRAY ? [...items, `… ${value.length - MAX_ARRAY} more`] : items;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SKIPPED_KEYS.has(key))
      .map(([key, item]) => [key, SECRET_KEY.test(key) ? '[hidden]' : sanitize(item, depth + 1)]),
  );
}

const LABEL_FIELDS = ['name', 'title', 'customerName', 'salonName', 'subject', 'email'];

/** What to call a record in the log, e.g. a blog's title. */
function labelOf(record: unknown): string | null {
  if (Array.isArray(record)) {
    return `${record.length} item${record.length === 1 ? '' : 's'}`;
  }
  if (!record || typeof record !== 'object') return null;

  const plain = 'toObject' in record && typeof record.toObject === 'function' ? record.toObject() : record;
  for (const field of LABEL_FIELDS) {
    const value = (plain as Record<string, unknown>)[field];
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 200);
  }
  return null;
}

function idOf(record: unknown): string | null {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const id = (record as { _id?: unknown })._id;
  return id ? String(id) : null;
}

function requestInfo(req: Request, res: Response) {
  return {
    method: req.method,
    // "/api/blogs/" → "/api/blogs"
    path: `${req.baseUrl}${req.path}`.replace(/(.)\/$/, '$1'),
    statusCode: res.statusCode,
    ip: req.ip ?? null,
    userAgent: req.get('user-agent')?.slice(0, 300) ?? null,
  };
}

/** Logging must never break the request it describes. */
function write(entry: Parameters<typeof ActivityLog.create>[0]): void {
  ActivityLog.create(entry).catch((err: unknown) => {
    console.error('Could not write activity log:', err);
  });
}

// ----------------------------------------------------------------------------
// Middleware
// ----------------------------------------------------------------------------

/**
 * Records a successful create / update / delete once the response is sent.
 * Failed requests (validation errors, 403s, 404s) change nothing and are not
 * logged. Must run after authenticate.
 */
export function recordActivity(resource: string, action: Exclude<ActivityAction, 'login' | 'login_failed'>): RequestHandler {
  return (req, res, next) => {
    const store: ActivityStore = {};

    const json = res.json.bind(res);
    res.json = ((body: unknown) => {
      store.body = body;
      return json(body);
    }) as Response['json'];

    res.on('finish', () => {
      const actor = req.user;
      if (!actor || res.statusCode >= 400) return;

      const record = action === 'delete' ? store.deleted : store.body;

      write({
        actor: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action,
        resource,
        targetId: (req.params.id as string | undefined) ?? idOf(record),
        targetLabel: labelOf(record),
        details: action === 'delete' ? null : sanitize(req.body),
        ...requestInfo(req, res),
      });
    });

    context.run(store, next);
  };
}

/** POST /api/auth/login, both outcomes — failed attempts are worth seeing too. */
export function recordLogin(
  req: Request,
  res: Response,
  outcome: { success: true; user: { id: string; name: string; email: string; role: string } } | { success: false; email: string },
): void {
  write({
    actor: outcome.success ? outcome.user.id : null,
    actorName: outcome.success ? outcome.user.name : '',
    actorEmail: outcome.success ? outcome.user.email : outcome.email,
    actorRole: outcome.success ? outcome.user.role : '',
    action: outcome.success ? 'login' : 'login_failed',
    resource: 'auth',
    targetId: null,
    targetLabel: null,
    details: null,
    ...requestInfo(req, res),
    // Called before the response is sent, so its status is not set yet.
    statusCode: outcome.success ? 200 : 401,
  });
}

// ----------------------------------------------------------------------------
// Mongoose plugin
// ----------------------------------------------------------------------------

/**
 * A DELETE response is only `{ message }`, so the log would not know what
 * was deleted. This hook hands the deleted document to the request's
 * recordActivity. Registered globally in config/mongoosePlugins.ts.
 */
export function captureDeletedPlugin(schema: Schema): void {
  const remember = (doc: unknown) => {
    const store = context.getStore();
    if (store && doc && store.deleted === undefined) store.deleted = doc;
  };

  schema.post('findOneAndDelete', function (doc: unknown) {
    remember(doc);
  });
  schema.post('deleteOne', { document: true, query: false }, function (this: unknown) {
    remember(this);
  });
}
