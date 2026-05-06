# Flight Operations API Documentation

This document covers the flight operations endpoints exposed for frontend integration.

Base path:

```text
/api/v1/flight-operations
```

## Authentication and Access

All endpoints in this module require:

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
  "message": "Unauthorized: Invalid token version"
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

## Data and Validation Notes

- `movementType` must be one of `ARRIVAL` or `DEPARTURE`.
- `scheduledTime` must be in `HH:mm:ss` format.
- `actualTime` must be an ISO datetime string.
- `date` must be an ISO datetime string.
- The backend normalizes `date` to the Lagos calendar day (`Africa/Lagos`) before saving or querying records.
- Delay status is derived from time difference:
- `PENDING`: no `actualTime`
- `ON_TIME`: delay is `0` or negative
- `MINOR_DELAY`: delay is `1` to `15` minutes
- `DELAYED`: delay is greater than `15` minutes
- `CANCELLED`: can be set manually on upsert; when used, the backend stores `actualTime` as `null`.

## Common Validation Error Shape

Most validation failures in this module return:

```json
{
  "message": "Invalid input data",
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "scheduledTime": [
        "Time must be in HH:mm:ss format"
      ]
    }
  }
}
```

## Endpoints

### `GET /api/v1/flight-operations/daily`

Returns the daily operations table by merging daily schedule records with any saved operation records for the same Lagos day.

Query parameters:

- `date`: required in practice, ISO datetime string used as the day anchor.
- `page`: optional, default `1`.
- `limit`: optional, default `20`.
- `movementType`: optional, `ARRIVAL` or `DEPARTURE`.
- `airlineCode`: optional string.
- `search`: optional string, matched against `flightNumber` and `airportName`.
- `status`: optional, one of `ON_TIME`, `MINOR_DELAY`, `DELAYED`, `PENDING`.

Example request:

```text
GET /api/v1/flight-operations/daily?date=2026-04-15T00:00:00.000Z&page=1&limit=20&movementType=ARRIVAL&airlineCode=Q9&search=LOS&status=PENDING
```

Success response: `200 OK`

```json
{
  "message": "Daily operations retrieved successfully",
  "data": [
    {
      "scheduleId": "clxsch123",
      "flightNumber": "Q9123",
      "airlineCode": "Q9",
      "airportName": "Lagos",
      "scheduledTime": "09:30:00",
      "movementType": "ARRIVAL",
      "operationId": "clxop123",
      "soulsOnBoard": 112,
      "actualTime": "2026-04-15T09:42:00.000Z",
      "aircraftReg": "5N-BXX",
      "aircraftType": "B737",
      "bayName": "BAY 04",
      "delayMinutes": 12,
      "delayStatus": "MINOR_DELAY"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

Response field notes:

- `operationId` is `null` when no operation record has been created for that schedule row.
- `soulsOnBoard`, `actualTime`, `aircraftReg`, `aircraftType`, `bayName`, and `delayMinutes` are `null` when no operation data exists.
- `delayStatus` defaults to `PENDING` when `actualTime` has not been recorded.

Frontend notes:

- This endpoint is the main source for the editable daily table.
- The returned rows are schedule-driven, not operation-driven.
- The `meta.total` and `meta.totalPages` are calculated from the schedule query before the final in-memory status filter is applied. If you filter by `status`, pagination metadata may not perfectly match the filtered row count.

Possible error responses:

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

### `PATCH /api/v1/flight-operations/upsert`

Creates a new flight operation record if one does not exist for the same `flightNumber + date + movementType`, otherwise updates the existing record.

Request body:

```json
{
  "flightNumber": "Q9123",
  "movementType": "ARRIVAL",
  "aircraftReg": "5N-BXX",
  "bayName": "BAY 04",
  "airlineCode": "Q9",
  "airportCode": "LOS",
  "airportName": "Murtala Muhammed International Airport",
  "soulsOnBoard": 112,
  "scheduledTime": "09:30:00",
  "actualTime": "2026-04-15T09:42:00.000Z",
  "delayStatus": "MINOR_DELAY",
  "date": "2026-04-15T00:00:00.000Z"
}
```

Request field details:

- `flightNumber`: required in practice for upsert.
- `movementType`: required in practice for upsert.
- `date`: required in practice for upsert.
- `aircraftReg`: optional, looked up against aircraft registration number.
- `bayName`: optional, looked up against bay name.
- `airlineCode`: optional, looked up against airline code.
- `airportCode`: optional, looked up against airport code.
- `airportName`: optional fallback used to resolve the airport by name when `airportCode` is not available.
- `soulsOnBoard`: optional integer, must be positive.
- `scheduledTime`: optional by schema, but should be sent whenever creating a new record.
- `actualTime`: optional ISO datetime string.
- `delayStatus`: optional. Supports `ON_TIME`, `MINOR_DELAY`, `DELAYED`, `PENDING`, and `CANCELLED`.
- `aircraftType`: accepted by validation schema but currently not used by the service.

Resolution rules:

- `airlineCode` is resolved in this order: request `airlineCode`, schedule `airlineCode`, then the first token from `flightNumber`.
- If no airline code is resolved but a matched aircraft exists, the aircraft's airline is used.
- `airportCode` is resolved first from the request, then from the schedule row for that day.
- If no airport code is available, the backend tries `airportName` from the request, then schedule `airportName`.
- The service looks up the matching schedule row for the same `flightNumber`, `movementType`, and Lagos day before resolving airline and airport fallbacks.
- If `delayStatus` is sent as `CANCELLED`, the backend forces `actualTime` to `null` and stores `delayStatus` as `CANCELLED`.
- For non-cancelled records, delay minutes and delay status are recalculated from `scheduledTime` and `actualTime` when `scheduledTime` is present.

Success response: `200 OK`

```json
{
  "message": "Flight operation upserted successfully",
  "data": {
    "id": "clxop123",
    "flightNumber": "Q9123",
    "movementType": "ARRIVAL",
    "airlineId": "clxairl123",
    "aircraftId": "clxair123",
    "airportId": "clxairp123",
    "bayId": "clxbay123",
    "soulsOnBoard": 112,
    "scheduledTime": "09:30:00",
    "actualTime": "2026-04-15T09:42:00.000Z",
    "delayMinutes": 12,
    "delayStatus": "MINOR_DELAY",
    "date": "2026-04-15T00:00:00.000Z",
    "createdById": "clxuser123",
    "createdAt": "2026-04-15T09:10:00.000Z",
    "updatedAt": "2026-04-15T09:42:30.000Z"
  }
}
```

Possible error responses:

- `400 Bad Request`

```json
{
  "message": "Invalid input data",
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "date": [
        "Invalid datetime"
      ]
    }
  }
}
```

- `400 Bad Request`

```json
{
  "message": "flightNumber, movementType and date are required"
}
```

- `404 Not Found`

```json
{
  "message": "Aircraft not found"
}
```

- `404 Not Found`

```json
{
  "message": "Bay not found"
}
```

- `404 Not Found`

```json
{
  "message": "Airline not found"
}
```

- `404 Not Found`

```json
{
  "message": "Airport not found"
}
```

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

Frontend notes:

- Use this endpoint for inline table edits.
- If you are creating a brand-new operation, send `scheduledTime` along with `flightNumber`, `movementType`, and `date`.
- If `actualTime` is omitted, the backend will return `delayStatus` as `PENDING`.
- If you want to mark a flight as cancelled, send `"delayStatus": "CANCELLED"`. The backend will clear `actualTime`.
- You can now provide `airlineCode`, `airportCode`, or `airportName` explicitly instead of relying only on schedule-derived values.

### `GET /api/v1/flight-operations/schedule`

Looks up a single scheduled flight for a specific day without creating or updating an operation record.

Query parameters:

- `flightNumber`: required string.
- `movementType`: required, `ARRIVAL` or `DEPARTURE`.
- `date`: required ISO datetime string used as the Lagos day anchor.

Example request:

```text
GET /api/v1/flight-operations/schedule?flightNumber=Q9123&movementType=ARRIVAL&date=2026-04-15T00:00:00.000Z
```

Success response: `200 OK`

```json
{
  "message": "Flight retrieved successfully",
  "data": {
    "flightNumber": "Q9123",
    "airlineCode": "Q9",
    "airportName": "Lagos",
    "scheduledTime": "09:30:00",
    "status": "SCHEDULED"
  }
}
```

Possible error responses:

- `400 Bad Request`

```json
{
  "message": "flightNumber, movementType and date are required"
}
```

- `404 Not Found`

```json
{
  "message": "Flight not found in schedule"
}
```

### `POST /api/v1/flight-operations`

Manually creates a flight operation record.

Request body:

```json
{
  "flightNumber": "Q9123",
  "movementType": "ARRIVAL",
  "aircraftReg": "5N-BXX",
  "aircraftType": "B737",
  "bayName": "BAY 04",
  "soulsOnBoard": 112,
  "scheduledTime": "09:30:00",
  "actualTime": "2026-04-15T09:42:00.000Z",
  "date": "2026-04-15T00:00:00.000Z"
}
```

Request field details:

- `flightNumber`: required, minimum length `2`.
- `movementType`: required, `ARRIVAL` or `DEPARTURE`.
- `aircraftReg`: optional, looked up against aircraft registration number.
- `aircraftType`: accepted by schema but not currently used by the service.
- `bayName`: optional, looked up against bay name.
- `soulsOnBoard`: optional integer, must be positive.
- `scheduledTime`: required, `HH:mm:ss`.
- `actualTime`: optional ISO datetime string.
- `date`: required ISO datetime string.

Success response: `201 Created`

```json
{
  "message": "Flight operation created successfully",
  "data": {
    "id": "clxop123",
    "flightNumber": "Q9123",
    "movementType": "ARRIVAL",
    "airlineId": null,
    "aircraftId": "clxair123",
    "airportId": null,
    "bayId": "clxbay123",
    "soulsOnBoard": 112,
    "scheduledTime": "09:30:00",
    "actualTime": "2026-04-15T09:42:00.000Z",
    "delayMinutes": null,
    "delayStatus": null,
    "date": "2026-04-15T00:00:00.000Z",
    "createdById": "clxuser123",
    "createdAt": "2026-04-15T09:10:00.000Z",
    "updatedAt": "2026-04-15T09:10:00.000Z"
  }
}
```

Possible error responses:

- `400 Bad Request`

```json
{
  "message": "Invalid input data",
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "scheduledTime": [
        "Time must be in HH:mm:ss format"
      ]
    }
  }
}
```

- `404 Not Found`

```json
{
  "message": "Aircraft not found"
}
```

- `404 Not Found`

```json
{
  "message": "Bay not found"
}
```

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

Frontend notes:

- Prefer `PATCH /upsert` for the editable operations table.
- `POST /` is better suited for manual or secondary workflows.
- This endpoint returns the raw operation record as stored by Prisma.

## Dashboard Summary Endpoint

### `GET /api/v1/dashboard/today-summary`

Returns the current Lagos-day dashboard summary for operations.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Requires `ADMIN` or `SUPERVISOR` role.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Dashboard summary retrieved successfully",
  "data": {
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
        "airlineId": "clxairl123",
        "airlineName": "Air Peace",
        "airlineCode": "P4",
        "totalFlights": 10
      },
      {
        "airlineId": null,
        "airlineName": "Unknown",
        "airlineCode": null,
        "totalFlights": 3
      }
    ]
  }
}
```

Response field notes:

- `completed` counts flight operations for today with non-null `actualTime`.
- `pending` is computed as `totalScheduled - completed`.
- `delayed` is the count of operations with `delayStatus` equal to `DELAYED`.
- `statusBreakdown` provides counts for `ON_TIME`, `MINOR_DELAY`, `DELAYED`, and `CANCELLED`.
- `airlineBreakdown` is grouped from saved `flightOperation` rows, not directly from the daily schedule table.
- `airlineBreakdown[].airlineName` becomes `"Unknown"` and `airlineCode` becomes `null` when `airlineId` is not set on an operation.

Frontend notes:

- This endpoint uses the server's current Lagos day and does not accept a date query parameter.
- `airlineBreakdown` only reflects operations that have been created or updated for today.
- `totalScheduled`, `arrivals`, and `departures` come from the daily schedule table, so they can be higher than the total number of operation rows represented in `airlineBreakdown`.

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

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

### `GET /api/v1/flight-operations/history`

Returns historical flight operation records within a specified date range, with optional filtering and pagination.

Query parameters:

- `startDate`: required ISO date string (YYYY-MM-DD).
- `endDate`: required ISO date string (YYYY-MM-DD).
- `page`: optional, default `1`.
- `limit`: optional, default `20`.
- `movementType`: optional, `ARRIVAL` or `DEPARTURE`.
- `airlineCode`: optional string.
- `search`: optional string, matched against `flightNumber`.
- `status`: optional, one of `ON_TIME`, `MINOR_DELAY`, `DELAYED`, `PENDING`.

Example request:

```text
GET /api/v1/flight-operations/history?startDate=2026-04-10&endDate=2026-04-15&page=1&limit=20&movementType=ARRIVAL&airlineCode=Q9&search=Q9&status=ON_TIME
```

Success response: `200 OK`

```json
{
  "message": "Flight history retrieved successfully",
  "data": [
    {
      "id": "clxop123",
      "flightNumber": "Q9123",
      "movementType": "ARRIVAL",
      "airlineId": "clxairl123",
      "aircraftId": "clxair123",
      "airportId": "clxairp123",
      "bayId": "clxbay123",
      "soulsOnBoard": 112,
      "scheduledTime": "09:30:00",
      "actualTime": "2026-04-15T09:42:00.000Z",
      "delayMinutes": 12,
      "delayStatus": "MINOR_DELAY",
      "date": "2026-04-15T00:00:00.000Z",
      "createdById": "clxuser123",
      "createdAt": "2026-04-15T09:10:00.000Z",
      "updatedAt": "2026-04-15T09:42:30.000Z",
      "airline": {
        "id": "clxairl123",
        "code": "Q9",
        "name": "Air Peace"
      },
      "aircraft": {
        "id": "clxair123",
        "registration": "5N-BXX",
        "type": "B737"
      },
      "bay": {
        "id": "clxbay123",
        "name": "BAY 04",
        "code": "B04"
      },
      "airport": {
        "id": "clxairp123",
        "name": "Lagos",
        "code": "LOS"
      }
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

- The `data` array contains flight operation records with related `airline`, `aircraft`, `bay`, and `airport` objects included.
- Dates are filtered inclusively between `startDate` and `endDate`.

Possible error responses:

- `400 Bad Request`

```json
{
  "message": "Invalid date format"
}
```

- `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

Frontend notes:

- Use this endpoint for generating reports or viewing historical flight operations data.
- Ensure `startDate` and `endDate` are provided to avoid broad queries.
