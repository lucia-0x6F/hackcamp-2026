import type { ActivityType } from '../types.js';

export interface ActivityRecord {
  id: string; creatorId: string; schoolId: number; name: string; description: string;
  type: ActivityType; location: string; startTime: string; endTime: string; link: string | null;
}

export interface ActivityFilters {
  schoolId: number; type?: ActivityType; location?: string; startTime?: string; endTime?: string;
}

export interface ActivityRepository {
  create(activity: ActivityRecord): Promise<ActivityRecord>;
  findById(id: string): Promise<ActivityRecord | null>;
  list(filters: ActivityFilters): Promise<ActivityRecord[]>;
  cleanupExpired(): Promise<void>;
  update(id: string, activity: Partial<Omit<ActivityRecord, 'id' | 'creatorId'>>): Promise<ActivityRecord | null>;
  delete(id: string, creatorId: string): Promise<boolean>;
}
