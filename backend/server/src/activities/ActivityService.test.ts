import { describe, expect, it, vi } from 'vitest';
import { ActivityService } from './ActivityService.js';
import { validateActivity } from './ActivityValidator.js';
import { AppError } from '../domain/errors.js';
import { User } from '../domain/User.js';
import { AuthUser } from '../login/AuthUser.js';
import type { ActivityRepository, ActivityRecord } from '../repositories/ActivityRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';

const auth = new AuthUser('user-1', 'user@student.ubc.ca');
const otherAuth = new AuthUser('user-2', 'other@student.ubc.ca');
const input = { name: 'Study group', description: 'Review notes', type: 'study' as const, location: 'Library', startTime: '2030-01-01T10:00:00Z', endTime: '2030-01-01T11:00:00Z', link: null };
const activity: ActivityRecord = { id: 'activity-1', creatorId: auth.id, schoolId: 1, ...input, startTime: new Date(input.startTime).toISOString(), endTime: new Date(input.endTime).toISOString() };

function setup() {
  const activities = { findById: vi.fn(), list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } as unknown as ActivityRepository;
  const users = { find: vi.fn(), exists: vi.fn(), save: vi.fn() } as unknown as UserRepository;
  const service = new ActivityService(activities, users);
  return { activities, users, service };
}

describe('ActivityValidator', () => {
  it('normalizes names, locations, and dates', () => {
    const result = validateActivity({ ...input, name: '  Study group ', location: ' Library ' });
    expect(result.name).toBe('Study group');
    expect(result.location).toBe('Library');
    expect(result.startTime).toBe('2030-01-01T10:00:00.000Z');
  });

  it('rejects invalid activity input', () => {
    expect(() => validateActivity({ ...input, name: '' })).toThrow();
    expect(() => validateActivity({ ...input, description: 'x'.repeat(501) })).toThrow();
    expect(() => validateActivity({ ...input, endTime: input.startTime })).toThrow();
  });
});

describe('ActivityService permissions', () => {
  it('creates an activity at the authenticated profile school', async () => {
    const { activities, users, service } = setup();
    vi.mocked(users.find).mockResolvedValue({ schoolId: 2 } as any);
    vi.mocked(activities.create).mockImplementation(async (value) => value);

    const created = await service.create(auth, input);

    expect(created).toMatchObject({ creatorId: auth.id, schoolId: 2, name: input.name });
  });

  it('lists only activities at the authenticated profile school', async () => {
    const { activities, users, service } = setup();
    vi.mocked(users.find).mockResolvedValue({ schoolId: 3 } as any);
    vi.mocked(activities.list).mockResolvedValue([]);

    await service.list(auth, { type: 'study', location: 'Library' });

    expect(activities.list).toHaveBeenCalledWith({ schoolId: 3, type: 'study', location: 'Library' });
  });

  it('returns an activity by id', async () => {
    const { activities, service } = setup();
    vi.mocked(activities.findById).mockResolvedValue(activity);
    await expect(service.get(activity.id)).resolves.toEqual(activity);
  });

  it('allows only the creator to update an activity', async () => {
    const { activities, service } = setup();
    vi.mocked(activities.findById).mockResolvedValue(activity);
    await expect(service.update(otherAuth, activity.id, input)).rejects.toMatchObject({ status: 403 });
    expect(activities.update).not.toHaveBeenCalled();
  });

  it('allows only the creator to delete an activity', async () => {
    const { activities, service } = setup();
    vi.mocked(activities.delete).mockResolvedValue(false);
    await expect(service.delete(otherAuth, activity.id)).rejects.toMatchObject({ status: 404 });
    expect(activities.delete).toHaveBeenCalledWith(activity.id, otherAuth.id);
  });

  it('updates an activity only after validating the input', async () => {
    const { activities, service } = setup();
    vi.mocked(activities.findById).mockResolvedValue(activity);
    vi.mocked(activities.update).mockResolvedValue(activity);
    await service.update(auth, activity.id, { ...input, name: ' Updated ' });
    expect(activities.update).toHaveBeenCalledWith(activity.id, expect.objectContaining({ name: 'Updated' }));
  });

  it('rejects activity creation when the user has no profile', async () => {
    const { users, service } = setup();
    vi.mocked(users.find).mockResolvedValue(null);
    await expect(service.create(auth, input)).rejects.toMatchObject({ status: 400 });
  });
});
