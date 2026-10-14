import { Schema, model } from 'mongoose';
import { ACTIVITY_ACTIONS, type IActivityLog } from './activityLog.types.js';

/** How long entries are kept before MongoDB deletes them. */
export const ACTIVITY_LOG_RETENTION_DAYS = 365;

const activityLogSchema = new Schema<IActivityLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: '' },
    actorEmail: { type: String, default: '' },
    actorRole: { type: String, default: '' },

    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    resource: { type: String, required: true },
    targetId: { type: String, default: null },
    targetLabel: { type: String, default: null },

    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    details: { type: Schema.Types.Mixed, default: null },

    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    // Entries are written once and never updated.
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        const { __v: _version, ...safe } = ret;
        return safe;
      },
    },
  },
);

activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: ACTIVITY_LOG_RETENTION_DAYS * 24 * 60 * 60 });
activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, createdAt: -1 });

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);
