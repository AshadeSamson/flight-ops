# Reference Data API Documentation

This document covers the lookup and admin CRUD endpoints for the master reference tables: airlines, aircrafts, bays, and airports.

Base path:

```text
/api/v1/ref
```

## Authentication and access

All reference endpoints require:

```http
Authorization: Bearer <access_token>
```

Current access rules as implemented in the routes:

- `GET` endpoints: any authenticated user.
- `POST`, `PATCH`, and `DELETE` for `airlines`, `bays`, and `airports`: `ADMIN` only.
- `POST`, `PATCH`, and `DELETE` for `aircrafts`: `ADMIN`, `SUPERVISOR`, `OPS_STAFF`.
- `OPS_PERSONNEL` is not listed on any mutation route under `/api/v1/ref`.
- Successful aircraft and airport creates/updates also enqueue non-blocking replication events; the API response does not wait for downstream replication.

## Lookup endpoints

### `GET /api/v1/ref/aircrafts`

Returns all aircraft records ordered by registration number.

Auth:

- Any authenticated user.

### `GET /api/v1/ref/bays`

Returns all bay records ordered by name.

Auth:

- Any authenticated user.

### `GET /api/v1/ref/airports`

Returns all airport records ordered by name.

Auth:

- Any authenticated user.

### `GET /api/v1/ref/airlines`

Returns all airline records ordered by name.

Auth:

- Any authenticated user.

## Admin mutation endpoints

### `POST /api/v1/ref/airlines`

Creates a new airline.

Auth:

- `ADMIN` only.

### `PATCH /api/v1/ref/airlines/:id`

Updates an airline.

Auth:

- `ADMIN` only.

### `DELETE /api/v1/ref/airlines/:id`

Deletes an airline.

Auth:

- `ADMIN` only.

### `POST /api/v1/ref/aircrafts`

Creates an aircraft.

Auth:

- `ADMIN`, `SUPERVISOR`, `OPS_STAFF`

### `PATCH /api/v1/ref/aircrafts/:id`

Updates an aircraft.

Auth:

- `ADMIN`, `SUPERVISOR`, `OPS_STAFF`

### `DELETE /api/v1/ref/aircrafts/:id`

Deletes an aircraft.

Auth:

- `ADMIN`, `SUPERVISOR`, `OPS_STAFF`

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Aircraft deleted successfully"
}
```

Possible business-rule error messages returned through the global error handler:

- `Aircraft not found`
- `Cannot delete aircraft currently in use`

### `POST /api/v1/ref/bays`

Creates a bay.

Auth:

- `ADMIN` only.

### `PATCH /api/v1/ref/bays/:id`

Updates a bay.

Auth:

- `ADMIN` only.

### `DELETE /api/v1/ref/bays/:id`

Deletes a bay.

Auth:

- `ADMIN` only.

### `POST /api/v1/ref/airports`

Creates an airport.

Auth:

- `ADMIN` only.

### `PATCH /api/v1/ref/airports/:id`

Updates an airport.

Auth:

- `ADMIN` only.

### `DELETE /api/v1/ref/airports/:id`

Deletes an airport.

Auth:

- `ADMIN` only.

## Error handling note

The reference mutation services currently throw plain `Error` objects for business-rule failures such as duplicate values, missing records, and delete conflicts. The global handler returns `500 Internal Server Error` with the standard envelope (`success`, `message`, `statusCode`, `path`, `timestamp`).

Frontend note:

- When a mutation fails with a descriptive message, treat the returned `message` as the business-rule reason even when the HTTP status is `500`.
- The general API rate limit is 500 requests per 15-minute window per IP; rate-limit responses use `429 Too Many Requests`.

## Role policy summary

| Ref resource | Read access | Mutation access |
| --- | --- | --- |
| Airlines | any authenticated user | `ADMIN` |
| Aircrafts | any authenticated user | `ADMIN`, `SUPERVISOR`, `OPS_STAFF` |
| Bays | any authenticated user | `ADMIN` |
| Airports | any authenticated user | `ADMIN` |

## Bay Admin Endpoints

### `POST /api/v1/ref/bays`

Creates a new bay.

Auth:

- `ADMIN` only.

Request body:

```json
{
  "name": "BAY 04",
  "code": "B04"
}
```

Behavior notes:

- `name` is trimmed.
- `code` is trimmed and converted to uppercase.
- Duplicate `name` and duplicate `code` are both rejected.

Success response: `201 Created`

```json
{
  "message": "Bay created successfully",
  "data": {
    "id": "clxbay123",
    "name": "BAY 04",
    "code": "B04",
    "createdAt": "2026-04-16T09:00:00.000Z",
    "updatedAt": "2026-04-16T09:00:00.000Z"
  }
}
```

Possible business-rule error messages returned through the global error handler:

- `Bay name already exists`
- `Bay code already exists`

### `PATCH /api/v1/ref/bays/:id`

Updates a bay.

Auth:

- `ADMIN` only.

Path params:

- `id`: bay ID.

Request body:

All fields are optional.

```json
{
  "name": "BAY 05",
  "code": "B05"
}
```

Behavior notes:

- `name` is trimmed when provided.
- `code` is trimmed and uppercased when provided.
- The backend checks for duplicate names and codes on other bay records.

Success response: `200 OK`

```json
{
  "message": "Bay updated successfully",
  "data": {
    "id": "clxbay123",
    "name": "BAY 05",
    "code": "B05",
    "createdAt": "2026-04-16T09:00:00.000Z",
    "updatedAt": "2026-04-16T10:00:00.000Z"
  }
}
```

Possible business-rule error messages returned through the global error handler:

- `Bay not found`
- `Another bay already uses this name`
- `Another bay already uses this code`

### `DELETE /api/v1/ref/bays/:id`

Deletes a bay.

Auth:

- `ADMIN` only.

Path params:

- `id`: bay ID.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Bay deleted successfully"
}
```

Possible business-rule error messages returned through the global error handler:

- `Bay not found`
- `Cannot delete bay currently in use`

## Airport Admin Endpoints

### `POST /api/v1/ref/airports`

Creates a new airport.

Auth:

- `ADMIN` only.

Request body:

```json
{
  "name": "Murtala Muhammed International Airport",
  "code": "LOS"
}
```

Behavior notes:

- `name` is trimmed.
- `code` is trimmed and converted to uppercase.
- Duplicate airport codes are rejected.

Success response: `201 Created`

```json
{
  "message": "Airport created successfully",
  "data": {
    "id": "clxapt123",
    "name": "Murtala Muhammed International Airport",
    "code": "LOS",
    "createdAt": "2026-04-16T09:00:00.000Z",
    "updatedAt": "2026-04-16T09:00:00.000Z"
  }
}
```

Possible business-rule error messages returned through the global error handler:

- `Airport code already exists`

### `PATCH /api/v1/ref/airports/:id`

Updates an airport.

Auth:

- `ADMIN` only.

Path params:

- `id`: airport ID.

Request body:

All fields are optional.

```json
{
  "name": "Nnamdi Azikiwe International Airport",
  "code": "ABV"
}
```

Behavior notes:

- `name` is trimmed when provided.
- `code` is trimmed and uppercased when provided.
- The backend checks that no other airport already uses the new code.

Success response: `200 OK`

```json
{
  "message": "Airport updated successfully",
  "data": {
    "id": "clxapt123",
    "name": "Nnamdi Azikiwe International Airport",
    "code": "ABV",
    "createdAt": "2026-04-16T09:00:00.000Z",
    "updatedAt": "2026-04-16T10:00:00.000Z"
  }
}
```

Possible business-rule error messages returned through the global error handler:

- `Airport not found`
- `Another airport already uses this code`

### `DELETE /api/v1/ref/airports/:id`

Deletes an airport.

Auth:

- `ADMIN` only.

Path params:

- `id`: airport ID.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Airport deleted successfully"
}
```

Possible business-rule error messages returned through the global error handler:

- `Airport not found`
- `Cannot delete airport currently in use`

## Response Patterns

Lookup endpoints return:

```json
{
  "message": "Human readable success message",
  "data": []
}
```

Create and update endpoints return:

```json
{
  "message": "Human readable success message",
  "data": {}
}
```

Delete endpoints return:

```json
{
  "message": "Human readable success message"
}
```

## Frontend Integration Notes

- Use lookup endpoints to populate dropdowns before calling flight operation endpoints.
- For flight operation payloads, send `aircraftReg` using `aircrafts[].registrationNumber`.
- For flight operation payloads, send `bayName` using `bays[].name`.
- Admin CRUD endpoints currently rely on backend-thrown error messages rather than field-level validation responses.
- Because service-level business-rule failures currently come back as `500`, frontend error handling should read and display the `message` field from the response body.
