import { Schema, model } from 'mongoose';
import { ALL_PERMISSIONS } from './role.permissions.js';
import type { IRole } from './role.types.js';

const roleSchema = new Schema<IRole>(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true, immutable: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    permissions: { type: [{ type: String, enum: ALL_PERMISSIONS }], default: [] },
    isSystem: { type: Boolean, default: false, immutable: true },
    // Built-in roles only: the defaults already given, so a permission added to
    // the defaults later is granted once and a removal made on the Roles page sticks.
    defaultsApplied: { type: [String], default: undefined, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const { __v: _version, ...safe } = ret;
        return safe;
      },
    },
  },
);

export const Role = model<IRole>('Role', roleSchema);
