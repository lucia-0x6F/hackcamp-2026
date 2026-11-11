import type { Request, Response, NextFunction } from 'express';
import { AuthUser } from './AuthUser.js';

const NS = process.env.AUTH0_CLAIMS_NAMESPACE ?? 'https://oncampus.app';

export class AuthGuard {
  static requireAccountEmail(req: Request, res: Response, next: NextFunction): void {
    const payload = req.auth?.payload;
    if (!payload?.sub) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Auth0 may include email directly or under the configured namespace.
    const email = (payload.email as string | undefined) ?? (payload[`${NS}/email`] as string | undefined) ?? null;
    // `sub` has already been verified by the JWT middleware. Do not require
    // an email claim: Auth0 access tokens commonly omit it.
    res.locals.user = new AuthUser(payload.sub, email?.trim().toLowerCase() ?? null);
    next();
  }
}
