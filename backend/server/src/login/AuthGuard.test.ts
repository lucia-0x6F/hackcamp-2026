import { describe, expect, it, vi } from 'vitest';
import { AuthGuard } from './AuthGuard.js';

function request(payload: Record<string, unknown>) {
  return { auth: { token: JSON.stringify(payload), payload } } as any;
}

function response() {
  const res: any = { locals: {}, status: vi.fn() };
  res.status.mockReturnValue({ json: vi.fn() });
  return res;
}

describe('AuthGuard account email resolution', () => {
  it('accepts a valid verified Auth0 email claim', async () => {
    const req = request({ sub: 'auth0|student-1', email: 'student@gmail.com', email_verified: true });
    const res = response();
    const next = vi.fn();

    await AuthGuard.requireAccountEmail(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.locals.user).toMatchObject({
      id: 'auth0|student-1',
      email: 'student@gmail.com',
    });
  });

  it('rejects an authenticated token whose email is not verified', async () => {
    const req = request({ sub: 'auth0|student-1', email: 'student@gmail.com', email_verified: false });
    const res = response();
    const next = vi.fn();

    await AuthGuard.requireAccountEmail(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects an authenticated token with no account email', async () => {
    const req = request({ sub: 'auth0|student-1' });
    const res = response();
    const next = vi.fn();

    await AuthGuard.requireAccountEmail(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
