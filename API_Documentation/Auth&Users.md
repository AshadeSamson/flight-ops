#### API_URL: `https://flight-ops-production.up.railway.app`

# Auth, Users & Dashboard API Documentation

This document covers the authentication, user management, and dashboard endpoints exposed by the backend for frontend integration.

Base path:

```text
/api/v1
```

## Authentication Overview

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

Access token notes:

- Returned by `POST /api/v1/auth/login`.
- JWT expires in `12h`.
- `GET /api/v1/auth/me` is the main session-rehydration endpoint for the frontend.
- User management endpoints other than `GET /api/v1/users/profile` are restricted to `ADMIN`.
- Dashboard summary is restricted to `ADMIN` and `SUPERVISOR`.

## Common Error Shapes

### Basic auth or access error

```json
{
  "message": "Unauthorized"
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

### Validation error with field errors only

```json
{
  "message": "Invalid input data",
  "errors": {
    "password": [
      "String must contain at least 8 character(s)"
    ]
  }
}
```

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

- `email`: required, must be a valid email.
- `password`: required, must not be empty.

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

Triggers password reset email flow.

Request body:

```json
{
  "email": "admin@example.com"
}
```

Validation rules:

- `email`: required, must be a valid email.

Success response: `200 OK`

This endpoint always returns the same success message whether the account exists or not.

```json
{
  "message": "If the account exists, a reset link has been sent"
}
```

Possible error responses:

- `400 Bad Request`

```json
{
  "message": "Invalid request"
}
```

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

Frontend note:

- The reset email contains a link like `/reset-password?token=<jwt_token>`.
- The frontend reset-password page should extract the `token` from the query string and send it to the password reset endpoint.

### `POST /api/v1/auth/password-reset`

Resets a password using the token from the reset email.

Request body:

```json
{
  "token": "<reset_token>",
  "password": "newpassword123"
}
```

Validation rules:

- `token`: required string.
- `password`: required, minimum length `8`.

Success response: `200 OK`

```json
{
  "message": "Password reset successful"
}
```

Possible error responses:

- `400 Bad Request`

```json
{
  "message": "Invalid request"
}
```

- `400 Bad Request`

```json
{
  "message": "Invalid or expired token"
}
```

- `400 Bad Request`

```json
{
  "message": "Invalid token"
}
```

- `404 Not Found`

```json
{
  "message": "User not found"
}
```

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

### `GET /api/v1/auth/me`

Returns the currently authenticated user from the auth middleware context.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Any authenticated user can access this route.

Request body:

- None

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

Frontend notes:

- Use this endpoint to restore the logged-in user after app refresh.
- The current implementation returns `id`, `role`, `email`, and `name`.
- It does not currently return `staffId`.

Possible error responses:

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `401 Unauthorized`

```json
{
  "message": "Unauthorized: Invalid token"
}
```

- `404 Not Found`

```json
{
  "message": "User does not exist"
}
```

## User Endpoints

### `GET /api/v1/users/profile`

Returns the current authenticated user's profile.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Any authenticated user can access this route.

Request body:

- None

Success response: `200 OK`

```json
{
  "id": "clx123456789",
  "email": "admin@example.com",
  "name": "John Doe",
  "role": "ADMIN"
}
```

Frontend note:

- The service attempts to return `staffId`, but the current auth middleware does not attach `staffId` to `req.user`.
- Treat `staffId` on this endpoint as unreliable or absent unless the backend middleware is updated.

Possible error responses:

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `401 Unauthorized`

```json
{
  "message": "Unauthorized: Invalid token"
}
```

- `404 Not Found`

```json
{
  "message": "User does not exist"
}
```

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

### `POST /api/v1/users`

Creates a new user.

Auth:

- Requires `Authorization: Bearer <access_token>`.
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

- `name`: required, minimum length `3`.
- `email`: required, valid email.
- `password`: required, minimum length `8`.
- `role`: required, one of `ADMIN`, `SUPERVISOR`, `OPS_STAFF`.
- `staffId`: required, must match `BASL/ID/########` with 8 to 10 digits.

Normalization:

- `email` is saved in lowercase.
- `staffId` is saved in uppercase.

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

- `400 Bad Request`

```json
{
  "message": "Invalid request body",
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "staffId": [
        "Invalid staff ID"
      ]
    }
  }
}
```

- `409 Conflict`

```json
{
  "message": "Email is already in use!"
}
```

- `409 Conflict`

```json
{
  "message": "Staff ID already exists"
}
```

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `403 Forbidden`

```json
{
  "message": "Forbidden: Insufficient permissions"
}
```

### `GET /api/v1/users`

Returns a paginated list of users.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Requires `ADMIN`.

Query parameters:

- `page`: optional, default `1`.
- `limit`: optional, default `10`, maximum `50`.

Success response: `200 OK`

```json
{
  "users": [
    {
      "id": "clx123456789",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "SUPERVISOR",
      "staffId": "BASL/ID/12345678",
      "createdAt": "2026-04-10T12:00:00.000Z"
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

Possible error responses:

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `403 Forbidden`

```json
{
  "message": "Forbidden: Insufficient permissions"
}
```

### `GET /api/v1/users/:id`

Returns one user by ID.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Requires `ADMIN`.

Path params:

- `id`: user ID.

Success response: `200 OK`

```json
{
  "user": {
    "id": "clx123456789",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "SUPERVISOR",
    "staffId": "BASL/ID/12345678",
    "createdAt": "2026-04-10T12:00:00.000Z"
  }
}
```

Possible error responses:

- `400 Bad Request`

```json
{
  "message": "User ID is required"
}
```

- `404 Not Found`

```json
{
  "message": "User not found"
}
```

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `403 Forbidden`

```json
{
  "message": "Forbidden: Insufficient permissions"
}
```

### `PATCH /api/v1/users/:id`

Partially updates a user.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Requires `ADMIN`.

Path params:

- `id`: user ID.

Request body:

```json
{
  "name": "Jane Smith",
  "email": "janesmith@example.com",
  "password": "newpassword123",
  "role": "ADMIN",
  "staffId": "BASL/ID/12345679"
}
```

All fields are optional.

Validation rules:

- `name`: optional, minimum length `3`.
- `email`: optional, valid email.
- `password`: optional, minimum length `8`.
- `role`: optional, one of `ADMIN`, `SUPERVISOR`, `OPS_STAFF`.
- `staffId`: optional, must match `BASL/ID/########` with 8 to 10 digits.

Success response: `200 OK`

```json
{
  "message": "User updated successfully",
  "user": {
    "id": "clx123456789",
    "name": "Jane Smith",
    "email": "janesmith@example.com",
    "role": "ADMIN",
    "staffId": "BASL/ID/12345679"
  }
}
```

Possible error responses:

- `400 Bad Request`

```json
{
  "message": "Invalid input data",
  "errors": {
    "password": [
      "String must contain at least 8 character(s)"
    ]
  }
}
```

- `404 Not Found`

```json
{
  "message": "User not found"
}
```

- `409 Conflict`

```json
{
  "message": "Email is already in use"
}
```

- `409 Conflict`

```json
{
  "message": "Staff ID already exists"
}
```

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `403 Forbidden`

```json
{
  "message": "Forbidden: Insufficient permissions"
}
```

## Dashboard Endpoints

### `GET /api/v1/dashboard/today-summary`

Returns dashboard summary data for the current Lagos day and the latest archived snapshot.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Requires `ADMIN` or `SUPERVISOR`.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Dashboard summary retrieved successfully",
  "data": {
    "currentDay": {
      "totalScheduled": 48,
      "completed": 31,
      "pending": 17,
      "delayed": 6,
      "arrivals": 24,
      "departures": 24,
      "statusBreakdown": {
        "onTime": 18,
        "minorDelay": 7,
        "delayed": 6,
        "cancelled": 2
      },
      "airlineBreakdown": [
        {
          "airlineCode": "P4",
          "totalFlights": 10,
          "arrivals": 6,
          "departures": 4
        },
        {
          "airlineCode": "UNKNOWN",
          "totalFlights": 3,
          "arrivals": 2,
          "departures": 1
        }
      ]
    },
    "archiveDay": {
      "totalScheduled": 45,
      "completed": 28,
      "pending": 17,
      "delayed": 5,
      "arrivals": 22,
      "departures": 23,
      "statusBreakdown": {
        "onTime": 17,
        "minorDelay": 6,
        "delayed": 5,
        "cancelled": 1
      },
      "airlineBreakdown": [
        {
          "airlineCode": "P4",
          "totalFlights": 9,
          "arrivals": 5,
          "departures": 4
        }
      ]
    }
  }
}
```

Response field notes:

- `currentDay` is built from today's `dailyFlightSchedule` rows merged with matching live operations.
- `archiveDay` is built from the current contents of `archivedDailyOperation`.
- Each day block contains:
- `totalScheduled`, `completed`, `pending`, `delayed`, `arrivals`, and `departures`
- `statusBreakdown`: `onTime`, `minorDelay`, `delayed`, `cancelled`
- `airlineBreakdown`: grouped by `airlineCode` with `totalFlights`, `arrivals`, and `departures`
- Missing airline codes are grouped under `UNKNOWN`.

Frontend notes:

- This endpoint does not take query parameters.
- It uses the server's current Lagos day.
- `archiveDay` reflects the latest archived snapshot, not a multi-day history.

Possible error responses:

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `401 Unauthorized`

```json
{
  "message": "Unauthorized: Invalid token"
}
```

- `403 Forbidden`

```json
{
  "message": "Forbidden: Insufficient permissions"
}
```

- `404 Not Found`

```json
{
  "message": "User does not exist"
}
```

## Frontend Integration Notes

- Store the login `token` and send it as a Bearer token on protected requests.
- Use `GET /api/v1/auth/me` to rehydrate the current user session on app load.
- `forgot-password` should always show a neutral success state even when the email does not exist.
- `password-reset` requires the token from the reset link query string.
- Role values are exactly `ADMIN`, `SUPERVISOR`, and `OPS_STAFF`.
- `staffId` format is `BASL/ID/12345678` with 8 to 10 digits after the final slash.
