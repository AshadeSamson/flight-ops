# Archive Operations API Documentation

This document covers the archive operations endpoints used to view archived daily rows and update archived records into live flight operations.

Base path:

```text
/api/v1/archive-operations
```

## Authentication and Access

All archive endpoints require:

```http
Authorization: Bearer <access_token>
```

Allowed roles:

- `ADMIN`
- `SUPERVISOR`
- `OPS_STAFF`

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

Archive update errors are not manually converted into domain-specific HTTP status codes. Validation and service errors bubble through the global error handler.

Current global error response shape:

```json
{
  "success": false,
  "message": "Archived operation not found",
  "statusCode": 500,
  "path": "/api/v1/archive-operations/clxarchive123",
  "timestamp": "2026-05-07T12:00:00.000Z"
}
```

Frontend note:

- For archive update failures, read the `message` field and display that to the user.

## Endpoints

### `GET /api/v1/archive-operations`

Returns paginated archived daily operation rows.

Query parameters:

- `page`: optional, default `1`.
- `limit`: optional, default `20`.

Example request:

```text
GET /api/v1/archive-operations?page=1&limit=20
```

Success response: `200 OK`

```json
{
  "data": [
    {
      "id": "clxarchive123",
      "snapshotDate": "2026-05-06T00:00:00.000Z",
      "flightNumber": "P47123",
      "movementType": "ARRIVAL",
      "airlineCode": "P4",
      "airportName": "Lagos",
      "scheduledTime": "09:30:00",
      "operationId": "clxop123",
      "soulsOnBoard": 112,
      "actualTime": "2026-05-06T09:42:00.000Z",
      "aircraftReg": "5N-BXX",
      "aircraftType": "B737",
      "bayName": "BAY 04",
      "delayMinutes": 12,
      "delayStatus": "MINOR_DELAY",
      "createdAt": "2026-05-06T23:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Response field notes:

- This endpoint returns raw `ArchivedDailyOperation` rows from the database.
- `snapshotDate` is the archived operational day.
- `operationId` is the linked live flight operation ID at the time the snapshot was created, if any.
- `actualTime`, `soulsOnBoard`, `aircraftReg`, `aircraftType`, `bayName`, `delayMinutes`, and `delayStatus` can be `null` when there was no operation data at snapshot time.

Frontend notes:

- Use this endpoint to render archive/history tables from archived daily snapshots.
- Pagination metadata is returned as `meta.total`, `meta.page`, `meta.limit`, `meta.totalPages`, `meta.hasNextPage`, and `meta.hasPrevPage`.

### `PUT /api/v1/archive-operations/:id`

Updates an archived row and also upserts the corresponding live `flightOperation` record for that archived day.

Path params:

- `id`: required archive row ID.

Request body:

All fields are optional.

```json
{
  "aircraftReg": "5N-BXX",
  "bayName": "BAY 04",
  "soulsOnBoard": 112,
  "actualTime": "2026-05-06T09:42:00.000Z",
  "delayStatus": "MINOR_DELAY"
}
```

Accepted fields:

- `aircraftReg`: optional string.
- `bayName`: optional string.
- `soulsOnBoard`: optional number.
- `actualTime`: optional string.
- `delayStatus`: optional, one of `ON_TIME`, `MINOR_DELAY`, `DELAYED`, `CANCELLED`, `PENDING`.

Behavior notes:

- The service first loads the archived row by `id`.
- If `aircraftReg` is provided, it is mapped to a live aircraft record by `registrationNumber`.
- If `bayName` is provided, it is mapped to a live bay record by `name`.
- The service tries to resolve `airlineId` from the archived row's `airlineCode`.
- The service tries to resolve `airportId` from the archived row's `airportName`.
- The archived row's `snapshotDate` is normalized to the Lagos day and used to upsert a live `flightOperation`.
- If `delayStatus` is `CANCELLED`, `delayMinutes` becomes `null` and the stored delay status becomes `CANCELLED`.
- For non-cancelled updates, delay values are recalculated from the archived row's `scheduledTime` and the provided `actualTime`.
- After the live flight operation is upserted, the archived row itself is updated with the new editable values and recalculated delay fields.

Success response: `200 OK`

The current controller returns the upserted live `flightOperation` record, not the updated archive row.

```json
{
  "id": "clxop123",
  "flightNumber": "P47123",
  "movementType": "ARRIVAL",
  "airlineId": "clxairline123",
  "aircraftId": "clxair123",
  "airportId": "clxairport123",
  "bayId": "clxbay123",
  "soulsOnBoard": 112,
  "scheduledTime": "09:30:00",
  "actualTime": "2026-05-06T09:42:00.000Z",
  "delayMinutes": 12,
  "delayStatus": "MINOR_DELAY",
  "date": "2026-05-06T00:00:00.000Z",
  "createdById": "clxuser123",
  "createdAt": "2026-05-06T09:10:00.000Z",
  "updatedAt": "2026-05-07T08:00:00.000Z"
}
```

Possible validation or service error messages:

- `Missing archive id`
- `Archived operation not found`
- `Aircraft not found`
- `Bay not found`

Frontend notes:

- This endpoint is not a patch-on-archive-only operation. It also writes into the live `flightOperation` table.
- Because the response is a live flight operation object, the frontend should not expect the archive row shape back after update.
- To mark an archived row as cancelled, send `"delayStatus": "CANCELLED"`.
