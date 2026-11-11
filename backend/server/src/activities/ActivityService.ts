import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../login/AuthUser.js';
import type { ActivityInput } from '../types.js';
import type { ActivityRepository } from '../repositories/ActivityRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import { AppError } from '../domain/errors.js';
import { validateActivity } from './ActivityValidator.js';

export class ActivityService {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly users: UserRepository,
  ) {}

  async create(auth: AuthUser, input: ActivityInput) {
    const user = await this.users.find(auth.id);
    if (!user) {
      throw new AppError('Complete your profile first', 400);
    }

    const valid = validateActivity(input);

    return this.activities.create({
      id: randomUUID(),
      creatorId: auth.id,
      schoolId: user.schoolId,
      ...valid,
      link: valid.link ?? null,
    });
  }

  async get(id: string) {
    await this.activities.cleanupExpired?.();
    return this.activities.findById(id);
  }

  async list(
    auth: AuthUser,
    filters: Omit<Parameters<ActivityRepository['list']>[0], 'schoolId'>,
  ) {
    const user = await this.users.find(auth.id);
    if (!user) {
      throw new AppError('Complete your profile first', 400);
    }

    await this.activities.cleanupExpired?.();
    return this.activities.list({ schoolId: user.schoolId, ...filters });
  }

  async update(auth: AuthUser, id: string, input: ActivityInput) {
    const current = await this.activities.findById(id);
    if (!current) {
      throw new AppError('Activity not found', 404);
    }
    if (current.creatorId !== auth.id) {
      throw new AppError('Only the creator can edit this activity', 403);
    }

    return this.activities.update(id, validateActivity(input));
  }

  async delete(auth: AuthUser, id: string) {
    const deleted = await this.activities.delete(id, auth.id);
    if (!deleted) {
      throw new AppError('Activity not found or not owned by you', 404);
    }
  }
}
