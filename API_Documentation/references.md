# Reference Data API Documentation

This document covers the reference endpoints used for lookup data and admin CRUD management of airlines, aircrafts, bays, and airports.

Base path:

```text
/api/v1/ref
```

## Authentication and Access

All reference endpoints require:

```http
Authorization: Bearer <access_token>
```

Access rules:

- `GET` endpoints: any authenticated user.
- `POST`, `PATCH`, and `DELETE` endpoints: `ADMIN` only.

Common auth-related errors:

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
  "message": "Unauthorized: No user information found"
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

## Error Handling Note

The new create, update, and delete reference services currently throw plain `Error` objects. Those are caught by the global error handler and returned as `500 Internal Server Error`, even for business cases like duplicate values, missing records, or records currently in use.

Current global error response shape for thrown service errors:

```json
{
  "success": false,
  "message": "Airline code already exists",
  "statusCode": 500,
  "path": "/api/v1/ref/airlines",
  "timestamp": "2026-04-16T12:00:00.000Z"
}
```

Frontend note:

- For now, treat these `500` responses as business-rule failures when the message is descriptive, for example `Airline not found`, `Bay code already exists`, or `Cannot delete airport currently in use`.

## Lookup Endpoints

### `GET /api/v1/ref/aircrafts`

Returns all aircraft reference records ordered by registration number.

Auth:

- Any authenticated user.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Aircrafts retrieved successfully",
  "data": [
    {
      "id": "clxair123",
      "registrationNumber": "5N-BXX",
      "type": "B737",
      "maxCapacity": 140,
      "airlineCode": "Q9",
      "airlineName": "Green Africa"
    }
  ]
}
```

Frontend notes:

- Use `registrationNumber` for `aircraftReg` values sent to flight operation endpoints.
- `type` is display-friendly, but flight operation mapping currently uses `registrationNumber`.

### `GET /api/v1/ref/bays`

Returns all bay reference records ordered by name.

Auth:

- Any authenticated user.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Bays retrieved successfully",
  "data": [
    {
      "id": "clxbay123",
      "name": "BAY 04",
      "code": "B04"
    }
  ]
}
```

Frontend notes:

- Use `name` for `bayName` values sent to flight operation endpoints.

### `GET /api/v1/ref/airports`

Returns all airport reference records ordered by name.

Auth:

- Any authenticated user.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Airports retrieved successfully",
  "data": [
    {
      "id": "clxapt123",
      "name": "Murtala Muhammed International Airport",
      "code": "LOS"
    }
  ]
}
```

### `GET /api/v1/ref/airlines`

Returns all airline reference records ordered by name.

Auth:

- Any authenticated user.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Airlines retrieved successfully",
  "data": [
    {
      "id": "clxairline123",
      "name": "Green Africa",
      "code": "Q9"
    }
  ]
}
```

## Airline Admin Endpoints

### `POST /api/v1/ref/airlines`

Creates a new airline.

Auth:

- `ADMIN` only.

Request body:

```json
{
  "name": "Green Africa",
  "code": "Q9"
}
```

Behavior notes:

- `name` is trimmed.
- `code` is trimmed and converted to uppercase.
- Duplicate `code` values are rejected.

Success response: `201 Created`

```json
{
  "message": "Airline created successfully",
  "data": {
    "id": "clxairline123",
    "name": "Green Africa",
    "code": "Q9",
    "createdAt": "2026-04-16T09:00:00.000Z",
    "updatedAt": "2026-04-16T09:00:00.000Z"
  }
}
```

Possible business-rule error messages returned through the global error handler:

- `Airline code already exists`

### `PATCH /api/v1/ref/airlines/:id`

Updates an airline.

Auth:

- `ADMIN` only.

Path params:

- `id`: airline ID.

Request body:

All fields are optional.

```json
{
  "name": "Green Africa Airways",
  "code": "Q9"
}
```

Behavior notes:

- `name` is trimmed when provided.
- `code` is trimmed and converted to uppercase when provided.
- The backend checks that no other airline already uses the new code.

Success response: `200 OK`

```json
{
  "message": "Airline updated successfully",
  "data": {
    "id": "clxairline123",
    "name": "Green Africa Airways",
    "code": "Q9",
    "createdAt": "2026-04-16T09:00:00.000Z",
    "updatedAt": "2026-04-16T10:00:00.000Z"
  }
}
```

Possible business-rule error messages returned through the global error handler:

- `Airline not found`
- `Another airline already uses this code`

### `DELETE /api/v1/ref/airlines/:id`

Deletes an airline.

Auth:

- `ADMIN` only.

Path params:

- `id`: airline ID.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Airline deleted successfully"
}
```

Possible business-rule error messages returned through the global error handler:

- `Airline not found`
- `Cannot delete airline currently in use`

## Aircraft Admin Endpoints

### `POST /api/v1/ref/aircrafts`

Creates a new aircraft.

Auth:

- `ADMIN` only.

Request body:

```json
{
  "registrationNumber": "5N-BXX",
  "type": "B737",
  "maxCapacity": 140,
  "airlineCode": "Q9"
}
```

Behavior notes:

- `registrationNumber` is trimmed and converted to uppercase.
- `type` is trimmed.
- `airlineCode` is trimmed and converted to uppercase.
- `airlineCode` must already exist in the airline table.
- Duplicate aircraft registration numbers are rejected.

Success response: `201 Created`

```json
{
  "message": "Aircraft created successfully",
  "data": {
    "id": "clxair123",
    "registrationNumber": "5N-BXX",
    "type": "B737",
    "maxCapacity": 140,
    "airlineId": "clxairline123",
    "createdAt": "2026-04-16T09:00:00.000Z",
    "updatedAt": "2026-04-16T09:00:00.000Z"
  }
}
```

Possible business-rule error messages returned through the global error handler:

- `Airline not found`
- `Aircraft registration already exists`

### `PATCH /api/v1/ref/aircrafts/:id`

Updates an aircraft.

Auth:

- `ADMIN` only.

Path params:

- `id`: aircraft ID.

Request body:

All fields are optional.

```json
{
  "registrationNumber": "5N-BXY",
  "type": "B737-800",
  "maxCapacity": 150,
  "airlineCode": "Q9"
}
```

Behavior notes:

- `registrationNumber` is trimmed and uppercased when provided.
- `type` is trimmed when provided.
- `maxCapacity` is converted with `Number(...)`.
- `airlineCode` must exist if provided.
- The backend rejects a registration number already used by another aircraft.

Success response: `200 OK`

```json
{
  "message": "Aircraft updated successfully",
  "data": {
    "id": "clxair123",
    "registrationNumber": "5N-BXY",
    "type": "B737-800",
    "maxCapacity": 150,
    "airlineId": "clxairline123",
    "createdAt": "2026-04-16T09:00:00.000Z",
    "updatedAt": "2026-04-16T10:00:00.000Z"
  }
}
```

Possible business-rule error messages returned through the global error handler:

- `Aircraft not found`
- `Airline not found`
- `Another aircraft already uses this registration`

### `DELETE /api/v1/ref/aircrafts/:id`

Deletes an aircraft.

Auth:

- `ADMIN` only.

Path params:

- `id`: aircraft ID.

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
