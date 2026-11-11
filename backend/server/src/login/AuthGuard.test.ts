import { describe, expect, it, vi } from 'vitest';
import { AuthGuard } from './AuthGuard.js';

function request(payload: Record<string, unknown>) {
  return { auth: { token: 'signed-access-token', payload } } as any;
}

function response() {
  const res: any = { locals: {}, status: vi.fn() };
  res.status.mockReturnValue({ json: vi.fn() });
  return res;
}

describe('AuthGuard account email resolution', () => {
  it('accepts a valid Auth0 email claim without email_verified', async () => {
    const req = request({ sub: 'auth0|student-1', email: 'student@gmail.com' });
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

  it('rejects an authenticated token with no account email', async () => {
    const req = request({ sub: 'auth0|student-1' });
    const res = response();
    const next = vi.fn();

    await AuthGuard.requireAccountEmail(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
