import { describe, expect, it, vi } from 'vitest';
import { RecommendationService } from './RecommendationService.js';
import { AuthUser } from '../login/AuthUser.js';
import type { ActivityRepository } from '../repositories/ActivityRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';

describe('RecommendationService', () => {
  it('ranks activities matching user interests first and returns at most three', async () => {
    const activities = { list: vi.fn().mockResolvedValue([
      { id: '1', type: 'food' }, { id: '2', type: 'study' }, { id: '3', type: 'other' }, { id: '4', type: 'study' },
    ]) } as unknown as ActivityRepository;
    const user = { schoolId: 1, interestedTypes: ['study'], hobbies: [] };
    const users = { find: vi.fn().mockResolvedValue(user) } as unknown as UserRepository;
    const result = await new RecommendationService(activities, users).forUser(new AuthUser('u', 'u@student.ubc.ca'));
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('study');
  });

  it('returns an empty list when the user has no profile', async () => {
    const activities = { list: vi.fn() } as unknown as ActivityRepository;
    const users = { find: vi.fn().mockResolvedValue(null) } as unknown as UserRepository;
    await expect(new RecommendationService(activities, users).forUser(new AuthUser('u', 'u@student.ubc.ca'))).resolves.toEqual([]);
  });
});
