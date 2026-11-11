import { AuthUser } from './AuthUser.js';
import { User } from '../domain/User.js';
import { AppError } from '../domain/errors.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { SchoolRepository } from '../repositories/SchoolRepository.js';
import type { Profile } from '../types.js';
import type { NotificationService } from '../notifications/NotificationService.js';

export class ProfileService {
  constructor(
    private readonly users: UserRepository,
    private readonly schools: SchoolRepository,
    private readonly notifications?: NotificationService,
  ) {}

  async get(auth: AuthUser): Promise<User | null> { return this.users.find(auth.id); }

  async save(auth: AuthUser, input: Profile): Promise<User> {
    const isNewUser = !(await this.users.exists(auth.id));
    let school;
    try { school = await this.schools.mustFind(input.schoolId); } catch { throw new AppError('School not found', 400); }
    const user = User.create(auth.id, input, auth.storageEmail());
    await this.users.save(user);
    // Only send email when Auth0 actually supplied a deliverable address.
    if (isNewUser && this.notifications && auth.email) {
      try {
        await this.notifications.notifyWelcome(user.email, user.name);
      } catch (error) {
        console.error('Unable to send welcome email', error);
      }
    }
    return user;
  }
}
