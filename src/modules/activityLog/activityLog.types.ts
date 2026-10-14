import type { HydratedDocument, Types } from 'mongoose';

/**
 * What happened. `create` / `update` / `delete` come from admin panel routes
 * guarded by `can(...)`; the login ones from POST /api/auth/login.
 */
export const ACTIVITY_ACTIONS = ['create', 'update', 'delete', 'login', 'login_failed'] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

/**
 * One entry in the audit trail. Entries are never edited or deleted through
 * the API; MongoDB removes them once they pass ACTIVITY_LOG_RETENTION_DAYS.
 */
export interface IActivityLog {
  /** Null for a failed login, where nobody is signed in. */
  actor: Types.ObjectId | null;
  /** Copied at the time, so the entry still reads right after a rename or delete. */
  actorName: string;
  actorEmail: string;
  actorRole: string;

  action: ActivityAction;
  /** A permission resource key (e.g. `blogs`), or `auth` for logins. */
  resource: string;
  /** Id of the record acted on, when there is one. */
  targetId: string | null;
  /** Its name or title at the time, e.g. the blog's title. */
  targetLabel: string | null;

  method: string;
  path: string;
  statusCode: number;
  /** The request body with passwords and tokens removed and long text shortened. */
  details: unknown;

  ip: string | null;
  userAgent: string | null;

  createdAt: Date;
}

export type ActivityLogDocument = HydratedDocument<IActivityLog>;

export interface ActivityLogListResponse {
  items: ActivityLogDocument[];
  total: number;
  page: number;
  pages: number;
}

export interface ActivityLogFiltersResponse {
  /** Everyone who appears in the log, for the "Admin" filter. */
  actors: { id: string; name: string; email: string }[];
  resources: { key: string; label: string }[];
  actions: readonly ActivityAction[];
}
