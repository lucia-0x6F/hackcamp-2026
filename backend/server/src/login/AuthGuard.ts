import type { Request, Response, NextFunction } from 'express';
import { AuthUser } from './AuthUser.js';

const NS = process.env.AUTH0_CLAIMS_NAMESPACE ?? 'https://oncampus.app';
const EMAIL_CACHE_TTL_MS = 5 * 60 * 1000;
const resolvedEmails = new Map<string, { email: string; verified: boolean; expiresAt: number }>();

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
      let emailVerified = payload.email_verified === true || payload[`${NS}/email_verified`] === true;
      const token = req.auth?.token;
      const cached = token && resolvedEmails.get(token);
      if (!email && cached && cached.expiresAt > Date.now()) {
        email = cached.email;
      }
      if (!emailVerified && cached && cached.expiresAt > Date.now()) {
        emailVerified = cached.verified;
      }

      // Auth0 access tokens commonly omit profile claims. /userinfo requires
      // the access token to have been issued with the `openid email` scopes.
      if (!email) {
        const issuer = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/$/, '');
        if (issuer && token) {
          const response = await fetch(`${issuer}/userinfo`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const profile = await response.json() as { email?: unknown; email_verified?: unknown };
            if (typeof profile.email === 'string') email = profile.email;
            if (profile.email_verified === true) emailVerified = true;
          }
        }
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(403).json({ error: 'An account email is required' });
        return;
      }
      if (!emailVerified) {
        res.status(403).json({ error: 'Please verify your email address before continuing' });
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (token) {
        resolvedEmails.set(token, { email: normalizedEmail, verified: true, expiresAt: Date.now() + EMAIL_CACHE_TTL_MS });
      }
      res.locals.user = new AuthUser(payload.sub, normalizedEmail);
      next();
    } catch (error) {
      next(error);
    }
  }
}
