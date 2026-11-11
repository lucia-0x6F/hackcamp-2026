import { describe, expect, it, vi } from 'vitest';
import { ProfileService } from './ProfileService.js';
import { AuthUser } from './AuthUser.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { SchoolRepository } from '../repositories/SchoolRepository.js';

const profile = { schoolId: 1, name: 'Alice', schoolYear: 'first' as const, major: 'CS', hobbies: ['music'], interestedTypes: ['study' as const] };

describe('ProfileService', () => {
  it('saves a profile for a valid account email', async () => {
    const users = { find: vi.fn(), exists: vi.fn(), save: vi.fn() } as unknown as UserRepository;
    const schools = { mustFind: vi.fn().mockReturnValue({ id: 1, name: 'UBC', emailDomain: 'student.ubc.ca' }), list: vi.fn() } as unknown as SchoolRepository;
    const service = new ProfileService(users, schools);
    const result = await service.save(new AuthUser('user-1', 'alice@student.ubc.ca'), profile);
    expect(result.email).toBe('alice@student.ubc.ca');
    expect(users.save).toHaveBeenCalled();
  });

  it('allows a profile when the email domain differs from the selected school', async () => {
    const users = { find: vi.fn(), exists: vi.fn(), save: vi.fn() } as unknown as UserRepository;
    const schools = { mustFind: vi.fn().mockReturnValue({ id: 1, name: 'UBC', emailDomain: 'student.ubc.ca' }), list: vi.fn() } as unknown as SchoolRepository;
    const service = new ProfileService(users, schools);
    const result = await service.save(new AuthUser('user-1', 'alice@gmail.com'), profile);
    expect(result.email).toBe('alice@gmail.com');
  });

  it('saves a profile when an access token has no email claim', async () => {
    const users = { find: vi.fn(), exists: vi.fn(), save: vi.fn() } as unknown as UserRepository;
    const schools = { mustFind: vi.fn().mockReturnValue({ id: 1, name: 'UBC', emailDomain: 'student.ubc.ca' }), list: vi.fn() } as unknown as SchoolRepository;
    const service = new ProfileService(users, schools);
    const result = await service.save(new AuthUser('auth0|user-1', null), profile);
    expect(result.email).toBe('auth0-yxv0adb8dxnlci0x@users.oncampus.invalid');
  });
});
