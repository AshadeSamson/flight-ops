# Archive Operations API Documentation

This document covers archive lookup and archive-to-live correction flows.

Base path:

```text
/api/v1/archive-operations
```

## Authentication and access

All archive endpoints require:

```http
Authorization: Bearer <access_token>
```

Allowed roles:

- `ADMIN`
- `SUPERVISOR`
- `OPS_STAFF`
- `OPS_PERSONNEL`

This matches the route definitions in `src/routes/archive.routes.ts`.

## Endpoints

### `GET /api/v1/archive-operations`

Returns paginated archived daily operation rows.

Query params:

- `page`: optional, default `1`
- `limit`: optional, default `20`

Example:

```text
GET /api/v1/archive-operations?page=1&limit=20
```

### `PUT /api/v1/archive-operations/:id`

Updates an archived row and also upserts the corresponding live `flightOperation` for that archived day.

Key rules:

- `aircraftReg` is mapped to a live aircraft record by `registrationNumber`.
- `bayName` is mapped to a live bay record by `name`.
- The archived row's `snapshotDate` is normalized to the Lagos day before the live upsert.
- If `delayStatus` is `CANCELLED`, the service clears `actualTime` and sets `delayMinutes` to `null`.
- For other statuses, delay values are recalculated from the archived `scheduledTime` and the provided `actualTime`.
- `boardingTime` is stored as `boardingCall` on both the live operation and archive record.
- `remarks` are mirrored to the live operation and the archive snapshot.

Request body example:

```json
{
  "aircraftReg": "5N-BXX",
  "bayName": "BAY 04",
  "soulsOnBoard": 112,
  "actualTime": "2026-05-06T09:42:00.000Z",
  "boardingTime": "2026-05-06T09:10:00.000Z",
  "delayStatus": "MINOR_DELAY",
  "remarks": "Gate change confirmed"
}
```

Success response: `200 OK`

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
  "boardingCall": "2026-05-06T09:10:00.000Z",
  "delayMinutes": 12,
  "delayStatus": "MINOR_DELAY",
  "remarks": "Gate change confirmed",
  "date": "2026-05-06T00:00:00.000Z",
  "createdById": "clxuser123",
  "createdAt": "2026-05-06T09:10:00.000Z",
  "updatedAt": "2026-05-07T08:00:00.000Z"
}
```

## Common errors

- `401 Unauthorized`: missing or invalid token.
- `403 Forbidden`: insufficient permissions.
- `500 Internal Server Error`: service error or failed archive update.

## Important behavior note

The archive update service does not convert every business failure into a custom status code. Some validation and service failures bubble through the global error handler as generic `500` responses, and the frontend should read the `message` field when handling archive corrections.

Possible validation or service error messages:

- `Missing archive id`
- `Archived operation not found`
- `Aircraft not found`
- `Bay not found`

Frontend notes:

- This endpoint is not a patch-on-archive-only operation. It also writes into the live `flightOperation` table.
- Because the response is a live flight operation object, the frontend should not expect the archive row shape back after update.
- To mark an archived row as cancelled, send `"delayStatus": "CANCELLED"`.
