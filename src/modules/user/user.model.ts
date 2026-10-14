import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';
import { WEBSITE_ROLE, type IUser, type IUserMethods, type UserDocument, type UserModel } from './user.types.js';

const SALT_ROUNDS = 12;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    // A Role key; the API checks it exists before saving.
    role: { type: String, default: WEBSITE_ROLE, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const { password: _password, __v: _version, ...safe } = ret;
        return safe;
      },
    },
  },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.method('comparePassword', async function (this: UserDocument, candidate: string): Promise<boolean> {
  // password is select:false — query with .select('+password') before calling this.
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
});

export const User = model<IUser, UserModel>('User', userSchema);
