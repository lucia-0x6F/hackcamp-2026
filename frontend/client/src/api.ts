import { sampleApi } from './sampleData';

export const ACTIVITY_TYPES = ['study', 'food', 'sports', 'career', 'other'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type Profile = {
  schoolId: number;
  name: string;
  pronoun?: 'she/her' | 'he/him' | 'they/them' | 'prefer not to say' | null;
  schoolYear: 'first' | 'second' | 'third' | 'fourth' | 'fourth+' | 'graduate';
  major: string | null;
  hobbies: string[];
  interestedTypes: ActivityType[];
};

/** Mirrors ActivityRecord in backend/server/src/repositories/ActivityRepository.ts */
export type Activity = {
  id: string;
  creatorId: string;
  schoolId: number;
  name: string;
  description: string;
  type: ActivityType;
  location: string;
  startTime: string;
  endTime: string;
  link: string | null;
};

/** Mirrors JoinRequestRecord in backend/server/src/repositories/JoinRequestRepository.ts */
export type JoinRequest = {
  id: string;
  activityId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
};

/** Mirrors ActivityInput in backend/server/src/types.ts */
export type ActivityInput = Omit<Activity, 'id' | 'creatorId' | 'schoolId'>;

export type ActivityFilters = { type?: ActivityType; location?: string; startTime?: string; endTime?: string };

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Auth0 is configured when these public values are set (they are not secrets). */
export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN as string | undefined,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID as string | undefined,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined,
};
const auth0Configured = Boolean(auth0Config.domain && auth0Config.clientId && auth0Config.audience);

// App.tsx registers Auth0's getAccessTokenSilently here once the user is signed in.
let getToken: (() => Promise<string | undefined>) | null = null;
export const setTokenGetter = (fn: (() => Promise<string | undefined>) | null) => {
  getToken = fn;
};

/** Error from the API that keeps the HTTP status. */
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken ? await getToken() : undefined;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error ?? `Request failed (${response.status})`, response.status);
  return body.data as T;
}

const query = (filters: ActivityFilters) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const s = params.toString();
  return s ? `?${s}` : '';
};

const liveApi = {
  getProfile: () => request<Profile | null>('/api/profile'),
  saveProfile: (profile: Profile) => request<Profile>('/api/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  listActivities: (filters: ActivityFilters = {}) => request<Activity[]>(`/api/activities${query(filters)}`),
  getRecommendations: () => request<Activity[]>('/api/recommendations'),
  createActivity: (input: ActivityInput) =>
    request<Activity>('/api/activities', { method: 'POST', body: JSON.stringify(input) }),
  getActivity: (id: string) => request<Activity>(`/api/activities/${encodeURIComponent(id)}`),
  deleteActivity: (id: string) => request<void>(`/api/activities/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  requestToJoin: (activityId: string) =>
    request<JoinRequest>(`/api/join-requests/${encodeURIComponent(activityId)}/join`, { method: 'POST' }),
  /** Requests I've sent, newest first. */
  listMyRequests: () => request<JoinRequest[]>('/api/join-requests/me'),
  cancelRequest: (id: string) => request<void>(`/api/join-requests/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  /** Requests to an activity I host (host only). */
  listRequestsFor: (activityId: string) =>
    request<JoinRequest[]>(`/api/join-requests/${encodeURIComponent(activityId)}/requests`),
  reviewRequest: (id: string, status: 'accepted' | 'rejected') =>
    request<JoinRequest>(`/api/join-requests/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export type Api = typeof liveApi;

/**
 * Sample mode: VITE_USE_SAMPLE_DATA=true, or Auth0 isn't configured.
 * Nothing is sent over the network in that mode.
 */
export const usingSampleData = import.meta.env.VITE_USE_SAMPLE_DATA === 'true' || !auth0Configured;
export const api: Api = usingSampleData ? sampleApi : liveApi;
