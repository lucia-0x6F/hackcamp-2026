# Backend Testing Guide

This guide explains where to put tests and what each part of the backend should test.

## 1. Testing framework

Use **Vitest**. It works well with this TypeScript and ESM project.

Install it from `backend/server`:

```bash
npm install --save-dev vitest
```

Add these commands to `package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Run all tests with `npm test`, or use `npm run test:watch` while developing.

## 2. Where to put test files

Put a test next to the file it tests. Add `.test.ts` to the original filename.

```text
src/domain/TimeRange.ts
src/domain/TimeRange.test.ts
```

Suggested layout:

```text
src/
├── domain/
│   ├── TimeRange.ts / TimeRange.test.ts
│   ├── Activity.ts / Activity.test.ts
│   └── User.ts / User.test.ts
├── activities/
│   ├── ActivityValidator.ts / ActivityValidator.test.ts
│   ├── ActivityService.ts / ActivityService.test.ts
│   └── activityAPI.ts
├── joinRequests/
│   ├── JoinRequestService.ts / JoinRequestService.test.ts
│   └── joinRequestAPI.ts
├── login/
│   ├── Validator.ts / Validator.test.ts
│   ├── SchoolEmail.ts / SchoolEmail.test.ts
│   ├── AuthUser.ts / AuthUser.test.ts
│   └── ProfileService.ts / ProfileService.test.ts
├── recommendations/
│   └── RecommendationService.ts / RecommendationService.test.ts
└── repositories/
    ├── SqliteActivityRepository.ts / SqliteActivityRepository.test.ts
    ├── SqliteJoinRequestRepository.ts / SqliteJoinRequestRepository.test.ts
    └── SqliteUserRepository.ts / SqliteUserRepository.test.ts
```

## 3. What each file should test

### Domain classes

| File | What to test |
|---|---|
| `TimeRange.ts` | Valid dates, invalid dates, end time after start time, default two-hour duration, and overlapping ranges. |
| `Activity.ts` | Upcoming/ongoing/ended status, deletion, changing fields, valid links, and preventing time changes after the activity starts. |
| `User.ts` | Required name, trimmed values, lowercase email, and removing duplicate hobbies or interests. |

These are simple unit tests and do not need a database.

### Activity feature

| File | What to test |
|---|---|
| `ActivityValidator.ts` | Required name and location, maximum description length, valid dates, and valid HTTP/HTTPS links. |
| `ActivityService.ts` | Creating, listing, updating, and deleting activities. Only the creator should edit or delete an activity. |
| `activityAPI.ts` | Request validation, authentication, response status codes, and activity endpoints. |

For `ActivityService.test.ts`, use mocked repositories. This keeps the test focused on business rules instead of SQLite.

### Join request feature

| File | What to test |
|---|---|
| `JoinRequestService.ts` | Creating requests, preventing duplicates, preventing users from joining their own activity, and accepting/rejecting requests. |
| `joinRequestAPI.ts` | Request validation, authentication, permissions, and HTTP status codes. |

Important rules: users cannot join their own activity, and only the activity creator can manage join requests.

### Login and profile feature

| File | What to test |
|---|---|
| `Validator.ts` | Email format, trimming, lowercasing, and school-domain matching. |
| `SchoolEmail.ts` | Correct school domains are accepted and other domains are rejected. |
| `AuthUser.ts` | Verified, well-formed account emails can use the app; missing or unverified emails cannot. |
| `ProfileService.ts` | Creating/updating profiles, checking that the school exists, and matching email domain to school. |

### Recommendations

For `RecommendationService.ts`, test that only activities from the user's school are considered, matching interests are ranked first, no more than three activities are returned, and a missing profile is handled safely.

### Repositories

| File | What to test |
|---|---|
| `SqliteActivityRepository.ts` | Insert, find, list, filter, update, and soft-delete activities. |
| `SqliteJoinRequestRepository.ts` | Insert requests, list requests, update status, and reject duplicate activity/user pairs. |
| `SqliteUserRepository.ts` | Save/find users, update profiles, and correctly store hobbies and interests as JSON. |

Use a temporary or in-memory SQLite database. Do not use the real `oncampus.db` file.

### API endpoints

Activity API:

```text
GET    /api/activities
GET    /api/activities/:id
POST   /api/activities
PUT    /api/activities/:id
DELETE /api/activities/:id
```

Join request API:

```text
POST  /api/join-requests/:activityId/join
GET   /api/join-requests/:activityId/requests
PATCH /api/join-requests/:id
```

For each API, check that valid requests succeed, invalid requests return `400`, unauthenticated requests are rejected, unauthorized users receive `403`, and missing resources return `404`.

## 4. What to test first

Start with:

1. `TimeRange.test.ts`
2. `ActivityValidator.test.ts`
3. `ActivityService.test.ts`
4. `JoinRequestService.test.ts`
5. `ProfileService.test.ts`

These contain the main business rules. Add repository and API tests afterward.

## 5. Test safety

Tests should not call the real Auth0 service, a real email provider, or the development database. Mock Auth0 and email sending, and use a temporary SQLite database for repository tests.
