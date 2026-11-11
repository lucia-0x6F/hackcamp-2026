import type { Activity, Api, JoinRequest, Profile } from './api';

// Fake data for clicking through the UI without the backend. Times are built
// relative to "now" so the cards always read as today / tomorrow.
const at = (dayOffset: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const activities: Activity[] = [
  { id: 'a1', creatorId: 'u2', schoolId: 1, name: 'MATH 100 study session', description: 'Reviewing derivatives before the midterm.', type: 'study', location: 'Forestry Building', startTime: at(0, 15, 30), endTime: at(0, 17), link: null },
  { id: 'a2', creatorId: 'u3', schoolId: 1, name: 'Spikeball at the beach', description: 'Bring sunscreen, we have two sets.', type: 'sports', location: 'Wreck Beach', startTime: at(0, 17), endTime: at(0, 18), link: null },
  { id: 'a3', creatorId: 'u4', schoolId: 1, name: 'Free Rec Week Yoga', description: 'Beginner friendly, mats provided.', type: 'sports', location: 'Rec North Centre', startTime: at(1, 14), endTime: at(1, 15), link: null },
  { id: 'a4', creatorId: 'u5', schoolId: 1, name: 'Coffee after class', description: 'Anyone want to grab coffee and meet new people?', type: 'food', location: 'The Nest', startTime: at(1, 14), endTime: at(1, 15), link: null },
  { id: 'a5', creatorId: 'u6', schoolId: 1, name: 'Startup networking night', description: 'Looking for someone to go with.', type: 'career', location: 'Sauder', startTime: at(2, 18), endTime: at(2, 20), link: null },
];

let profile: Profile | null = {
  schoolId: 1, name: 'Hannah Wells', pronoun: 'she/her', schoolYear: 'first', major: 'Music',
  hobbies: ['outdoors'], interestedTypes: ['food', 'sports'],
};

// "me" hosts one activity with two requests, and has asked to join two others.
activities.push({ id: 'a6', creatorId: 'me', schoolId: 1, name: 'Board games at the Nest', description: 'Catan and snacks.', type: 'other', location: 'The Nest, room 2', startTime: at(1, 18), endTime: at(1, 21), link: null });
const requests: JoinRequest[] = [
  { id: 'r1', activityId: 'a6', userId: 'Leo (2nd year, CS)', status: 'pending', createdAt: at(0, 9) },
  { id: 'r2', activityId: 'a6', userId: 'Priya (1st year, Sauder)', status: 'pending', createdAt: at(0, 10) },
  { id: 'r3', activityId: 'a3', userId: 'me', status: 'accepted', createdAt: at(0, 8) },
  { id: 'r4', activityId: 'a5', userId: 'me', status: 'pending', createdAt: at(0, 11) },
];

const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 250));

export const sampleApi: Api = {
  getProfile: () => delay(profile),
  saveProfile: (p) => delay((profile = p)),
  listActivities: (filters = {}) =>
    delay(activities.filter((a) => !filters.type || a.type === filters.type)),
  getRecommendations: () =>
    delay(
      [...activities]
        .sort((a, b) => Number(profile?.interestedTypes.includes(b.type)) - Number(profile?.interestedTypes.includes(a.type)))
        .slice(0, 3),
    ),
  createActivity: (input) => {
    const created: Activity = { ...input, id: crypto.randomUUID(), creatorId: 'me', schoolId: profile?.schoolId ?? 1 };
    activities.push(created);
    return delay(created);
  },
  getActivity: (id) => {
    const found = activities.find((a) => a.id === id);
    return found ? delay(found) : Promise.reject(new Error('Activity not found'));
  },
  deleteActivity: (id) => {
    const i = activities.findIndex((a) => a.id === id && a.creatorId === 'me');
    if (i < 0) return Promise.reject(new Error('Activity not found or not owned by you'));
    activities.splice(i, 1);
    return delay(undefined);
  },
  requestToJoin: (activityId) => {
    const r: JoinRequest = { id: crypto.randomUUID(), activityId, userId: 'me', status: 'pending', createdAt: new Date().toISOString() };
    requests.push(r);
    return delay(r);
  },
  listMyRequests: () => delay(requests.filter((r) => r.userId === 'me')),
  cancelRequest: (id) => {
    const i = requests.findIndex((r) => r.id === id && r.status === 'pending');
    if (i >= 0) requests.splice(i, 1);
    return delay(undefined);
  },
  listRequestsFor: (activityId) => delay(requests.filter((r) => r.activityId === activityId)),
  reviewRequest: (id, status) => {
    const r = requests.find((x) => x.id === id);
    if (!r) return Promise.reject(new Error('Join request not found'));
    r.status = status;
    return delay({ ...r });
  },
};
