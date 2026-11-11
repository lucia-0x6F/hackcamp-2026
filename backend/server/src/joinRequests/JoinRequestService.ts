import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../login/AuthUser.js';
import type { ActivityRepository } from '../repositories/ActivityRepository.js';
import type { JoinRequestRepository, JoinRequestStatus } from '../repositories/JoinRequestRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import { AppError } from '../domain/errors.js';
import type { NotificationService } from '../notifications/NotificationService.js';

export class JoinRequestService {
  constructor(
    private readonly requests: JoinRequestRepository,
    private readonly activities: ActivityRepository,
    private readonly users: UserRepository,
    private readonly notifications: NotificationService,
  ) {}

  async create(auth: AuthUser, activityId: string) {
    const activity = await this.activities.findById(activityId);
    if (!activity) {
      throw new AppError('Activity not found', 404);
    }
    if (activity.creatorId === auth.id) {
      throw new AppError('You cannot join your own activity', 400);
    }
    if (!(await this.users.find(auth.id))) {
      throw new AppError('Complete your profile first', 400);
    }

    try {
      const request = await this.requests.create({
        id: randomUUID(),
        activityId,
        userId: auth.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      const [creator, applicant] = await Promise.all([
        this.users.find(activity.creatorId),
        this.users.find(auth.id),
      ]);
      if (creator && applicant) {
        await this.sendNotificationSafely(() =>
          this.notifications.notifyActivityCreatorOfJoinRequest(creator.email, activity, request, applicant),
        );
      }

      return request;
    } catch {
      throw new AppError('You already requested to join this activity', 409);
    }
  }

  async updateStatus(auth: AuthUser, id: string, status: JoinRequestStatus) {
    const request = await this.requests.find(id);
    if (!request) {
      throw new AppError('Join request not found', 404);
    }

    const activity = await this.activities.findById(request.activityId);
    if (!activity || activity.creatorId !== auth.id) {
      throw new AppError('Only the creator can review requests', 403);
    }

    if (request.status !== 'pending') {
      throw new AppError('Only pending requests can change status', 409);
    }

    if (status !== 'accepted' && status !== 'rejected') {
      throw new AppError('Invalid join request status', 400);
    }

    const updatedRequest = await this.requests.updateStatus(id, status);
    const applicant = await this.users.find(request.userId);

    if (updatedRequest && applicant && (status === 'accepted' || status === 'rejected')) {
      await this.sendNotificationSafely(() =>
        this.notifications.notifyApplicantOfDecision(applicant.email, activity, status),
      );
    }

    return updatedRequest;
  }

  async cancel(auth: AuthUser, id: string) {
    const request = await this.requests.find(id);
    if (!request) {
      throw new AppError('Join request not found', 404);
    }

    if (request.userId !== auth.id) {
      throw new AppError('You can only cancel your own join requests', 403);
    }

    if (request.status !== 'pending') {
      throw new AppError('Only pending requests can be cancelled', 409);
    }

    const deleted = await this.requests.delete(id, auth.id);
    if (!deleted) {
      throw new AppError('Join request could not be cancelled', 409);
    }
  }

  async list(auth: AuthUser, activityId: string) {
    const activity = await this.activities.findById(activityId);
      if (!activity || activity.creatorId !== auth.id) {
          throw new AppError('Only the creator can view requests', 403);
      }
      return await this.requests.listForActivity(activityId);
  }

  async listForUser(auth: AuthUser) {
    if (!(await this.users.find(auth.id))) {
      throw new AppError('Complete your profile first', 400);
    }

    return this.requests.listForUser(auth.id);
  }

  /** A temporary email failure must not undo a successful database operation. */
  private async sendNotificationSafely(send: () => Promise<void>): Promise<void> {
    try {
      await send();
    } catch (error) {
      console.error('Unable to send notification email', error);
    }
  }
}
