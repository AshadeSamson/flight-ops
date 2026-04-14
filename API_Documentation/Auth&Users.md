#### API_URL: `https://flight-ops-production.up.railway.app`

# Auth & Users API Documentation

This document covers the authentication and user management endpoints exposed by the backend for frontend integration.

Base path:

```text
/api/v1
```

## Authentication Overview

Protected user endpoints require this header:

```http
Authorization: Bearer <access_token>
```

Access token notes:

- Returned by the login endpoint.
- JWT expires in `12h`.
- User management endpoints other than `GET /users/profile` are restricted to `ADMIN`.

## Common Error Response Shapes

These are the main error formats currently returned by the codebase.

### Basic message error

```json
{
  "message": "Unauthorized"
}
```

### Validation error with flattened Zod errors

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

### Validation error with fieldErrors only

```json
{
  "message": "Invalid input data",
  "errors": {
    "email": [
      "Invalid email"
    ]
  }
}
```

## Auth Endpoints

### `POST /api/v1/auth/login`

Authenticate a user and return an access token.

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
- The frontend reset-password page should read the `token` from the query string and send it to the password reset endpoint below.

### `POST /api/v1/auth/password-reset`

Reset a user's password using the token from the reset email.

Request body:

```json
{
  "token": "<reset_token>",
  "password": "newpassword123"
}
```

Validation rules:

- `token`: required string.
- `password`: required, minimum length is `8`.

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

## User Endpoints

### `GET /api/v1/users/profile`

Returns the currently authenticated user's profile.

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
- For frontend integration, treat `staffId` on this endpoint as currently unreliable or absent unless the backend is updated.

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

- `401 Unauthorized`

```json
{
  "message": "Unauthorized: Invalid token version"
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

Create a new user.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Requires `ADMIN` role.

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

- `name`: required, minimum length is `3`.
- `email`: required, must be a valid email.
- `password`: required, minimum length is `8`.
- `role`: required, one of `ADMIN`, `SUPERVISOR`, `OPS_STAFF`.
- `staffId`: required string, must match `BASL/ID/########` with 8 to 10 digits.

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

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

### `GET /api/v1/users`

Fetch a paginated list of users.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Requires `ADMIN` role.

Query parameters:

- `page`: optional, default is `1`.
- `limit`: optional, default is `10`, maximum is `50`.

Example request:

```text
GET /api/v1/users?page=1&limit=10
```

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

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

### `GET /api/v1/users/:id`

Fetch a single user by ID.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Requires `ADMIN` role.

Path params:

- `id`: required user ID.

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

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

### `PATCH /api/v1/users/:id`

Update a user. This endpoint supports partial updates.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Requires `ADMIN` role.

Path params:

- `id`: required user ID.

Request body:

All fields are optional, but at least one field should be sent by the frontend.

```json
{
  "name": "Jane Smith",
  "email": "janesmith@example.com",
  "password": "newpassword123",
  "role": "ADMIN",
  "staffId": "BASL/ID/12345679"
}
```

Validation rules:

- `name`: optional, minimum length is `3`.
- `email`: optional, must be a valid email.
- `password`: optional, minimum length is `8`.
- `role`: optional, one of `ADMIN`, `SUPERVISOR`, `OPS_STAFF`.
- `staffId`: optional, if provided must match `BASL/ID/########` with 8 to 10 digits.

Normalization:

- `email` is saved in lowercase.
- `staffId` is saved in uppercase.

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

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

## Frontend Integration Notes

- Store the login `token` and send it as a Bearer token on protected requests.
- `forgot-password` should always show a neutral success message, even when the email does not exist.
- `password-reset` requires the `token` from the reset link query string.
- User list responses are paginated and include `meta.total`, `meta.page`, `meta.limit`, and `meta.totalPages`.
- Role values used by the backend are exactly `ADMIN`, `SUPERVISOR`, and `OPS_STAFF`.
- `staffId` format expected by validation is `BASL/ID/12345678` and accepts 8 to 10 digits after the final slash.
