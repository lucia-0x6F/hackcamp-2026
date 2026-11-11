# OnCampus API Documentation

## Base URL

When running locally:

```text
http://localhost:3000
```

All JSON requests should include:

```http
Content-Type: application/json
```

## Authentication

Protected endpoints require an Auth0 access token:

```http
Authorization: Bearer <access_token>
```

The access token must be valid, include a valid account email, and have `email_verified: true`. Requests from unverified accounts are rejected with `403`. School-domain restrictions are not enforced by the API.

## Common response format

Successful responses usually wrap the result in `data`:

```json
{
  "data": {}
}
```

Errors use this format:

```json
{
  "error": "Error message"
}
```

Validation errors may also include:

```json
{
  "error": "Invalid request",
  "details": []
}
```

## Endpoints

### Health check

#### `GET /api/health`

Checks whether the backend is running.

Authentication: Not required.

Response `200`:

```json
{
  "ok": true
}
```

### Schools

#### `GET /api/schools`

Returns the schools available in the profile dropdown.

Authentication: Not required.

Response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "name": "University of British Columbia"
    }
  ]
}
```

### Profile

#### `GET /api/profile`

Returns the authenticated user's profile.

Authentication: Required.

Response `200`:

```json
{
  "data": {
    "id": "auth0|user-id",
    "email": "student@student.ubc.ca",
    "schoolId": 1,
    "name": "Alex Chen",
    "schoolYear": "first",
    "major": "Computer Science",
    "hobbies": ["music", "hiking"],
    "interestedTypes": ["study", "career"]
  }
}
```

If the user has not created a profile yet, `data` is `null`.

#### `PUT /api/profile`

Creates or updates the authenticated user's profile.

Authentication: Required.

Request body:

```json
{
  "schoolId": 1,
  "name": "Alex Chen",
  "schoolYear": "first",
  "major": "Computer Science",
  "hobbies": ["music", "hiking"],
  "interestedTypes": ["study", "career"]
}
```

Valid `schoolYear` values:

```text
first, second, third, fourth, fourth+, graduate
```

Valid activity types:

```text
study, food, sports, career, other
```

Response `200`: Returns the saved profile in `data`.

### Activities

#### `GET /api/activities`

Returns upcoming activities from the authenticated user's school.

Authentication: Required.

Optional query parameters:

```text
type=study
location=Library
startTime=2030-01-01T09:00:00.000Z
endTime=2030-01-01T23:00:00.000Z
```

Example:

```text
GET /api/activities?type=study&location=Library
```

Response `200`:

```json
{
  "data": [
    {
      "id": "activity-id",
      "creatorId": "auth0|creator-id",
      "schoolId": 1,
      "name": "Study Together",
      "description": "Review lecture notes",
      "type": "study",
      "location": "UBC Library",
      "startTime": "2030-01-01T18:00:00.000Z",
      "endTime": "2030-01-01T20:00:00.000Z",
      "link": null
    }
  ]
}
```

#### `GET /api/activities/:id`

Returns one activity.

Authentication: Required.

Response `200`: Returns the activity in `data`.

#### `POST /api/activities`

Creates an activity for the authenticated user's school.

Authentication: Required.

Request body:

```json
{
  "name": "Study Together",
  "description": "Review lecture notes",
  "type": "study",
  "location": "UBC Library",
  "startTime": "2030-01-01T18:00:00.000Z",
  "endTime": "2030-01-01T20:00:00.000Z",
  "link": "https://example.com/event"
}
```

`link` is optional and must be a valid HTTP or HTTPS URL.

Response `201`: Returns the created activity in `data`.

#### `PUT /api/activities/:id`

Updates an activity.

Authentication: Required. Only the activity creator can update it.

Request body: Same format as `POST /api/activities`.

Response `200`: Returns the updated activity in `data`.

#### `DELETE /api/activities/:id`

Deletes an activity using a soft delete.

Authentication: Required. Only the activity creator can delete it.

Response `204`: No response body.

### Join requests

#### `POST /api/join-requests/:activityId/join`

Creates a pending request to join an activity.

Authentication: Required.

Request body: None.

Response `201`:

```json
{
  "data": {
    "id": "request-id",
    "activityId": "activity-id",
    "userId": "auth0|user-id",
    "status": "pending",
    "createdAt": "2030-01-01T12:00:00.000Z"
  }
}
```

#### `GET /api/join-requests/me`

Returns the authenticated user's join requests.

Authentication: Required.

Response `200`: Returns an array of join requests in `data`.

#### `DELETE /api/join-requests/:id`

Cancels the authenticated user's join request.

Authentication: Required. The request must belong to the user and have `pending` status.

Response `204`: No response body.

#### `GET /api/join-requests/:activityId/requests`

Returns join requests for an activity.

Authentication: Required. Only the activity creator can use this endpoint.

Response `200`: Returns an array of join requests in `data`.

#### `PATCH /api/join-requests/:id`

Accepts or rejects a join request.

Authentication: Required. Only the activity creator can review the request.

Request body:

```json
{
  "status": "accepted"
}
```

Allowed status changes:

```text
pending → accepted
pending → rejected
```

Processed requests cannot change status again.

Response `200`: Returns the updated join request in `data`.

### Recommendations

#### `GET /api/recommendations`

Returns up to three recommended activities for the authenticated user.

Authentication: Required.

Response `200`:

```json
{
  "data": []
}
```

## Error codes

| Status | Meaning |
|---|---|
| `400` | Invalid request body, invalid input, missing profile, or school validation error. |
| `401` | Missing or invalid authentication token. |
| `403` | Authenticated user does not have permission to perform the action. |
| `404` | Requested activity, profile, school, or join request does not exist. |
| `409` | Conflict, such as a duplicate join request or an invalid status transition. |
| `503` | Authentication is not configured on the backend. |
| `500` | Unexpected server error. |

