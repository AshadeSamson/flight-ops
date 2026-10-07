#### API_URL: `https://flight-ops-production.up.railway.app`

# Auth, Users & Dashboard API Documentation

This document covers the authentication, user management, and dashboard endpoints exposed by the backend for frontend integration.

Base path:

```text
/api/v1
```

## Current role model

The backend enforces access with exact role allow-lists in each route. The active roles in the current Prisma model are:

| Role | Current access scope |
| --- | --- |
| `ADMIN` | Full system access; manages users and all admin CRUD endpoints |
| `SUPERVISOR` | Operational oversight; can manage operations, reference maintenance, and dashboards |
| `OPS_STAFF` | Operational staff; can edit daily operations and aircraft reference records |
| `OPS_PERSONNEL` | Field/operations personnel; can read and update flight operations, archives, and dashboard data |

Important implementation notes:

- `requireRole` checks the user's JWT `role` against the specific allow-list on each route.
- There is no inherited hierarchy; a route must explicitly list every role allowed for that endpoint.
- The Prisma enum includes `OPS_PERSONNEL`, and the operation routes also allow it.
- The user validation schema in `src/controllers/users/user.schema.ts` now accepts the same active role set as the Prisma model: `ADMIN`, `SUPERVISOR`, `OPS_STAFF`, and `OPS_PERSONNEL`.

## Authentication Overview

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

Access token notes:

- Returned by `POST /api/v1/auth/login`.
- JWT expires in `12h`.
- `GET /api/v1/auth/me` is the session rehydration endpoint for the frontend.
- User management endpoints under `/api/v1/users` are restricted to `ADMIN`, except `/api/v1/users/profile`, which is available to any authenticated user.
- Dashboard, flight operations, and archive endpoints include `OPS_PERSONNEL` in their allowed roles where the code explicitly lists it.
- Auth routes are limited to 10 requests per 15-minute window per IP. Other `/api/v1` routes are limited to 500 requests per 15-minute window per IP. A rate-limit response is `429 Too Many Requests`.

## Common Error Shapes

### Basic auth or access error

```json
{
  "message": "Unauthorized"
}
```

### Permission error

```json
{
  "message": "Forbidden: Insufficient permissions"
}
```

### Validation error with flattened Zod output

```json
{
  "message": "Invalid request body",
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "email": [
        "Invalid email"
      ]
    }
  }
}
```

Errors passed to the global error handler use this envelope (and include `errors` when provided):

```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500,
  "path": "/api/v1/example",
  "timestamp": "2026-05-08T10:30:00.000Z"
}
```

The login handler returns flattened Zod validation errors; the forgot-password and password-reset handlers return `{ "message": "Invalid request" }` for invalid bodies.

## Auth Endpoints

### `POST /api/v1/auth/login`

Authenticates a user and returns an access token.

Request body:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Validation rules:

- `email`: required, valid email.
- `password`: required, non-empty.

Success response: `200 OK`

```json
{
  "message": "Login successful",
  "token": "<jwt_token>",
  "user": {
    "id": "clx123456789",
    "name": "John Doe",
    "email": "admin@example.com",
    "role": "ADMIN",
    "staffId": "BASL/ID/12345678"
  }
}
```

Possible error responses:

- `400 Bad Request`

```json
{
  "message": "Invalid request body",
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "email": [
        "Invalid email"
      ],
      "password": [
        "String must contain at least 1 character(s)"
      ]
    }
  }
}
```

- `401 Unauthorized`

```json
{
  "message": "Invalid email or password"
}
```

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

### `POST /api/v1/auth/forgot-password`

Triggers the password-reset email flow.

Request body:

```json
{
  "email": "admin@example.com"
}
```

Success response: `200 OK`

```json
{
  "message": "If the account exists, a reset link has been sent"
}
```

### `POST /api/v1/auth/password-reset`

Resets a password using the token returned in the email.

Request body:

```json
{
  "token": "<reset_token>",
  "password": "newpassword123"
}
```

Validation rules:

- `token`: required string.
- `password`: required, minimum `8` characters.

Success response: `200 OK`

```json
{
  "message": "Password reset successful"
}
```

### `GET /api/v1/auth/me`

Returns the currently authenticated user from the auth middleware context.

Auth:

- Requires a valid bearer token.
- Any authenticated user can access this route.

Success response: `200 OK`

```json
{
  "message": "Current user retrieved successfully",
  "data": {
    "id": "clx123456789",
    "role": "ADMIN",
    "email": "admin@example.com",
    "name": "John Doe"
  }
}
```

## User Endpoints

### `GET /api/v1/users/profile`

Returns the currently authenticated user's profile.

Auth:

- Requires a valid bearer token.
- Any authenticated user can access it.

Success response: `200 OK`

```json
{
  "id": "clx123456789",
  "email": "admin@example.com",
  "name": "John Doe",
  "role": "ADMIN"
}
```

### `POST /api/v1/users`

Creates a new user.

Auth:

- Requires a valid bearer token.
- Requires `ADMIN`.

Request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "SUPERVISOR",
  "staffId": "BASL/ID/12345678"
}
```

Validation rules:

- `name`: required, minimum `3` characters.
- `email`: required, valid email.
- `password`: required, minimum `8` characters.
- `role`: required; validated as `ADMIN`, `SUPERVISOR`, `OPS_STAFF`, or `OPS_PERSONNEL` by `user.schema.ts`.
- `staffId`: required; must match `BASL/ID/########` with 8 to 10 digits.

Normalization:

- `email` is stored lowercase.
- `staffId` is stored uppercase.

Success response: `201 Created`

```json
{
  "message": "User created successfully",
  "user": {
    "id": "clx123456789",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "SUPERVISOR",
    "staffId": "BASL/ID/12345678"
  }
}
```

Possible error responses:

- `409 Conflict` for duplicate email.
- `409 Conflict` for duplicate staff ID.
- `403 Forbidden` for insufficient permissions.

### `GET /api/v1/users`

Returns a paginated list of users.

Auth:

- Requires `ADMIN`.

Query params:

- `page`: optional, default `1`.
- `limit`: optional, default `10`.
- `limit` is capped at `50`.

Success response:

```json
{
  "users": [
    {
      "id": "clx123456789",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "SUPERVISOR",
      "staffId": "BASL/ID/12345678",
      "createdAt": "2026-05-07T09:10:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### `GET /api/v1/users/:id`

Returns one user by ID.

Auth:

- Requires `ADMIN`.
- Success response is `{ "user": { ... } }`; returns `404` with `"User not found"` when the ID does not identify an active user.

### `PATCH /api/v1/users/:id`

Partially updates a user.

Auth:

- Requires `ADMIN`.

All fields are optional.

Validation notes:

- `role` is validated as `ADMIN`, `SUPERVISOR`, `OPS_STAFF`, or `OPS_PERSONNEL` by the current schema.
- `email` and `staffId` are normalized before the uniqueness checks.
- Success response is `{ "message": "User updated successfully", "user": { ... } }`; missing active users return `404`, and duplicate email/staff ID values return `409`.

## Dashboard Endpoints

### `GET /api/v1/dashboard/today-summary`

Returns the current Lagos-day summary and a summary of the archived operation rows.

Auth:

- Requires a valid bearer token.
- Allowed roles: `ADMIN`, `SUPERVISOR`, `OPS_STAFF`, `OPS_PERSONNEL`.

This endpoint is explicitly protected by `requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF", "OPS_PERSONNEL")`.

Success response is `{ "message": "Dashboard summary retrieved successfully", "data": { "currentDay": { ... }, "archiveDay": { ... } } }`. `currentDay` summarizes the current Lagos-day schedule with live operation details; `archiveDay` summarizes archived rows.

## Route access summary at a glance

| Route group | Allowed roles |
| --- | --- |
| `/api/v1/auth/login`, `/forgot-password`, `/password-reset` | public, rate-limited |
| `/api/v1/auth/me` | any authenticated user |
| `/api/v1/users/profile` | any authenticated user |
| Other `/api/v1/users/*` routes | `ADMIN` |
| `/api/v1/dashboard/*` | `ADMIN`, `SUPERVISOR`, `OPS_STAFF`, `OPS_PERSONNEL` |
| `/api/v1/flight-operations/*` | `ADMIN`, `SUPERVISOR`, `OPS_STAFF`, `OPS_PERSONNEL` |
| `/api/v1/archive-operations/*` | `ADMIN`, `SUPERVISOR`, `OPS_STAFF`, `OPS_PERSONNEL` |
| `/api/v1/operations/sync-day/*` | `ADMIN`, `SUPERVISOR`, `OPS_STAFF` |
| `/api/v1/audit-logs/*` | `ADMIN`, `SUPERVISOR` |
| `/api/v1/ref/*` | any authenticated user for GET; `ADMIN` for airline/bay/airport mutations; `ADMIN`, `SUPERVISOR`, `OPS_STAFF` for aircraft mutations |
