import type { AuthUser } from '../modules/user/user.types.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware once the Bearer token is verified. */
      user?: AuthUser;
    }
  }
}

export {};
