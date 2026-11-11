import { describe, expect, it, vi } from 'vitest';
import { JoinRequestService } from './JoinRequestService.js';
import { NotificationService } from '../notifications/NotificationService.js';
import { AuthUser } from '../login/AuthUser.js';
import type { ActivityRepository, ActivityRecord } from '../repositories/ActivityRepository.js';
import type { JoinRequestRepository, JoinRequestRecord } from '../repositories/JoinRequestRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { EmailService } from '../notifications/EmailService.js';

const creator = new AuthUser('creator', 'creator@student.ubc.ca');
const applicant = new AuthUser('applicant', 'applicant@student.ubc.ca');
const activity: ActivityRecord = { id: 'activity-1', creatorId: creator.id, schoolId: 1, name: 'Study', description: '', type: 'study', location: 'Library', startTime: '2030-01-01T10:00:00.000Z', endTime: '2030-01-01T11:00:00.000Z', link: null };

function setup() {
  const requests = { create: vi.fn(), find: vi.fn(), updateStatus: vi.fn(), delete: vi.fn(), listForActivity: vi.fn(), listForUser: vi.fn() } as unknown as JoinRequestRepository;
  const activities = { findById: vi.fn(), list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } as unknown as ActivityRepository;
  const users = { find: vi.fn(), exists: vi.fn(), save: vi.fn() } as unknown as UserRepository;
  const email = { send: vi.fn() } as unknown as EmailService;
  const service = new JoinRequestService(requests, activities, users, new NotificationService(email));
  return { requests, activities, users, service };
}

describe('JoinRequestService permissions and status rules', () => {
  it('creates a pending request for a profiled non-creator and notifies the creator', async () => {
    const { requests, activities, users, service } = setup();
    vi.mocked(activities.findById).mockResolvedValue(activity);
    vi.mocked(users.find)
      .mockResolvedValueOnce({ email: 'creator@example.com', name: 'Creator' } as any)
      .mockResolvedValueOnce({ email: 'applicant@example.com', name: 'Applicant' } as any);
    vi.mocked(requests.create).mockImplementation(async (value) => value);

    const result = await service.create(applicant, activity.id);

    expect(result).toMatchObject({ activityId: activity.id, userId: applicant.id, status: 'pending' });
  });

  it('rejects joining a missing or self-created activity', async () => {
    const { activities, service } = setup();
    vi.mocked(activities.findById).mockResolvedValueOnce(null).mockResolvedValueOnce(activity);
    await expect(service.create(applicant, activity.id)).rejects.toMatchObject({ status: 404 });
    await expect(service.create(creator, activity.id)).rejects.toMatchObject({ status: 400 });
  });

  it('allows only the activity creator to review requests', async () => {
    const { requests, activities, service } = setup();
    const request: JoinRequestRecord = { id: 'request-1', activityId: activity.id, userId: applicant.id, status: 'pending', createdAt: '2030-01-01T00:00:00.000Z' };
    vi.mocked(requests.find).mockResolvedValue(request);
    vi.mocked(activities.findById).mockResolvedValue(activity);
    await expect(service.updateStatus(applicant, request.id, 'accepted')).rejects.toMatchObject({ status: 403 });
  });

  it('does not allow a processed request to change status', async () => {
    const { requests, activities, service } = setup();
    const request: JoinRequestRecord = { id: 'request-1', activityId: activity.id, userId: applicant.id, status: 'accepted', createdAt: '2030-01-01T00:00:00.000Z' };
    vi.mocked(requests.find).mockResolvedValue(request);
    vi.mocked(activities.findById).mockResolvedValue(activity);
    await expect(service.updateStatus(creator, request.id, 'rejected')).rejects.toMatchObject({ status: 409 });
    expect(requests.updateStatus).not.toHaveBeenCalled();
  });

  it('allows the applicant to cancel a pending request', async () => {
    const { requests, service } = setup();
    const request: JoinRequestRecord = { id: 'request-1', activityId: activity.id, userId: applicant.id, status: 'pending', createdAt: '2030-01-01T00:00:00.000Z' };
    vi.mocked(requests.find).mockResolvedValue(request);
    vi.mocked(requests.delete).mockResolvedValue(true);
    await expect(service.cancel(applicant, request.id)).resolves.toBeUndefined();
    expect(requests.delete).toHaveBeenCalledWith(request.id, applicant.id);
  });

  it('updates a pending request when the creator accepts it', async () => {
    const { requests, activities, users, service } = setup();
    const pending: JoinRequestRecord = { id: 'request-1', activityId: activity.id, userId: applicant.id, status: 'pending', createdAt: '2030-01-01T00:00:00.000Z' };
    vi.mocked(requests.find).mockResolvedValue(pending);
    vi.mocked(activities.findById).mockResolvedValue(activity);
    vi.mocked(requests.updateStatus).mockResolvedValue({ ...pending, status: 'accepted' });
    vi.mocked(users.find).mockResolvedValue({ email: 'applicant@example.com', name: 'Applicant' } as any);
    await expect(service.updateStatus(creator, pending.id, 'accepted')).resolves.toMatchObject({ status: 'accepted' });
  });

  it('lists a creator activity requests and an applicant requests', async () => {
    const { requests, activities, users, service } = setup();
    vi.mocked(activities.findById).mockResolvedValue(activity);
    vi.mocked(requests.listForActivity).mockResolvedValue([]);
    vi.mocked(users.find).mockResolvedValue({ id: applicant.id } as any);
    vi.mocked(requests.listForUser).mockResolvedValue([]);
    await expect(service.list(creator, activity.id)).resolves.toEqual([]);
    await expect(service.listForUser(applicant)).resolves.toEqual([]);
  });
});
