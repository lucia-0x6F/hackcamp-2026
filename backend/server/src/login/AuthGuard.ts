import type { Request, Response, NextFunction } from 'express';
import { AuthUser } from './AuthUser.js';

const NS = process.env.AUTH0_CLAIMS_NAMESPACE ?? 'https://oncampus.app';

export class AuthGuard {
  static async requireAccountEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    const payload = req.auth?.payload;
    if (!payload?.sub) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      // Auth0 may include email directly or under the configured namespace.
      let email = (payload.email as string | undefined) ?? (payload[`${NS}/email`] as string | undefined);

      // Auth0 access tokens commonly omit profile claims. /userinfo requires
      // the access token to have been issued with the `openid email` scopes.
      if (!email) {
        const issuer = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/$/, '');
        const token = req.auth?.token;
        if (issuer && token) {
          const response = await fetch(`${issuer}/userinfo`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const profile = await response.json() as { email?: unknown };
            if (typeof profile.email === 'string') email = profile.email;
          }
        }
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(403).json({ error: 'An account email is required' });
        return;
      }
      res.locals.user = new AuthUser(payload.sub, email.trim().toLowerCase());
      next();
    } catch (error) {
      next(error);
    }
  }
}
