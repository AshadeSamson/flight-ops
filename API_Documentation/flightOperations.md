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
- `actualTime` must be an ISO datetime string when supplied.
- `date` for `PATCH /upsert` and `POST /` must be an ISO datetime string.
- `date` for `GET /daily` must be sent as `YYYY-MM-DD`.
- The backend stores and queries operational days using Lagos-day boundaries.
- Delay/status behavior:
- `PENDING`: no actual time
- `ON_TIME`: delay is `0` or negative
- `MINOR_DELAY`: delay is `1` to `15` minutes
- `DELAYED`: delay is greater than `15` minutes
- `CANCELLED`: can be set manually on upsert; the backend stores `actualTime` as `null`

## Common Validation Error Shape

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

Returns the current daily board by merging today's schedule rows with matching live flight-operation rows.

Query parameters:

- `date`: required, format `YYYY-MM-DD`
- `page`: optional, default `1`
- `limit`: currently ignored by the controller; the endpoint always uses `20`
- `movementType`: optional, `ARRIVAL` or `DEPARTURE`
- `airlineCode`: optional string
- `search`: optional string, matched against `flightNumber` and `airportName`
- `status`: optional string, commonly `ON_TIME`, `MINOR_DELAY`, `DELAYED`, `PENDING`, or `CANCELLED`

Example request:

```text
GET /api/v1/flight-operations/daily?date=2026-05-07&page=1&movementType=ARRIVAL&airlineCode=P4&search=LOS&status=PENDING
```

Success response: `200 OK`

```json
{
  "message": "Daily operations retrieved successfully",
  "data": [
    {
      "scheduleId": "clxsch123",
      "flightNumber": "P47123",
      "airlineCode": "P4",
      "airportName": "Lagos",
      "scheduledTime": "09:30:00",
      "movementType": "ARRIVAL",
      "operationId": "clxop123",
      "soulsOnBoard": 112,
      "actualTime": "2026-05-07T09:42:00.000Z",
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
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Response notes:

- Rows are schedule-driven, not operation-driven.
- `operationId` is `null` when no live operation exists yet for that row.
- `soulsOnBoard`, `actualTime`, `aircraftReg`, `aircraftType`, `bayName`, and `delayMinutes` can be `null`.
- `delayStatus` defaults to `PENDING` when no actual time exists.

Possible error responses:

- `400 Bad Request`

```json
{
  "message": "date is required"
}
```

- `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Invalid date format. Use YYYY-MM-DD",
  "statusCode": 500,
  "path": "/api/v1/flight-operations/daily?date=2026-05-07T00:00:00.000Z",
  "timestamp": "2026-05-07T12:00:00.000Z"
}
```

Frontend notes:

- Use `YYYY-MM-DD` for the `date` query value.
- The current controller always returns 20 items per page even if another `limit` is sent.

### `PATCH /api/v1/flight-operations/upsert`

Creates or updates a live `flightOperation` identified by `flightNumber + date + movementType`.

Request body:

```json
{
  "flightNumber": "P47123",
  "movementType": "ARRIVAL",
  "aircraftReg": "5N-BXX",
  "bayName": "BAY 04",
  "airlineCode": "P4",
  "airportCode": "LOS",
  "airportName": "Murtala Muhammed International Airport",
  "soulsOnBoard": 112,
  "scheduledTime": "09:30:00",
  "actualTime": "2026-05-07T09:42:00.000Z",
  "delayStatus": "MINOR_DELAY",
  "date": "2026-05-07T00:00:00.000Z"
}
```

Request field details:

- `flightNumber`: required in practice
- `movementType`: required in practice
- `date`: required in practice
- `aircraftReg`: optional, matched against aircraft registration
- `bayName`: optional, matched against bay name
- `airlineCode`: optional, matched against airline code
- `airportCode`: optional, matched against airport code
- `airportName`: optional fallback when `airportCode` is unavailable
- `soulsOnBoard`: optional positive integer
- `scheduledTime`: optional by schema, but should be sent when creating a new record
- `actualTime`: optional ISO datetime string
- `delayStatus`: optional, supports `ON_TIME`, `MINOR_DELAY`, `DELAYED`, `PENDING`, `CANCELLED`
- `aircraftType`: accepted by schema but not used by the service

Resolution rules:

- Airline resolution order: request `airlineCode`, schedule `airlineCode`, then the first token of `flightNumber`.
- If no airline code is resolved but the aircraft exists, the aircraft's airline is used.
- Airport resolution order: request `airportCode`, schedule `airportCode`, then request/schedule `airportName`.
- The service checks today's matching schedule row before resolving airline and airport fallbacks.
- If `delayStatus` is `CANCELLED`, the backend clears `actualTime` and stores `delayStatus` as `CANCELLED`.
- For non-cancelled records, delay values are recalculated from `scheduledTime` and `actualTime` when `scheduledTime` exists.

Success response: `200 OK`

```json
{
  "message": "Flight operation upserted successfully",
  "data": {
    "id": "clxop123",
    "flightNumber": "P47123",
    "movementType": "ARRIVAL",
    "airlineId": "clxairl123",
    "aircraftId": "clxair123",
    "airportId": "clxairp123",
    "bayId": "clxbay123",
    "soulsOnBoard": 112,
    "scheduledTime": "09:30:00",
    "actualTime": "2026-05-07T09:42:00.000Z",
    "delayMinutes": 12,
    "delayStatus": "MINOR_DELAY",
    "date": "2026-05-07T00:00:00.000Z",
    "createdById": "clxuser123",
    "createdAt": "2026-05-07T09:10:00.000Z",
    "updatedAt": "2026-05-07T09:42:30.000Z"
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

Frontend notes:

- Use this endpoint for inline edits on the daily board.
- To mark a flight as cancelled, send `"delayStatus": "CANCELLED"`.
- You can now provide `airlineCode`, `airportCode`, or `airportName` explicitly instead of relying only on schedule-derived values.

### `GET /api/v1/flight-operations/schedule`

Looks up a single flight from today's schedule without creating or updating a live operation.

Query parameters:

- `flightNumber`: required string
- `movementType`: required, `ARRIVAL` or `DEPARTURE`
- `date`: required ISO datetime string used as the Lagos day anchor

Example request:

```text
GET /api/v1/flight-operations/schedule?flightNumber=P47123&movementType=ARRIVAL&date=2026-05-07T00:00:00.000Z
```

Success response: `200 OK`

```json
{
  "message": "Flight retrieved successfully",
  "data": {
    "flightNumber": "P47123",
    "airlineCode": "P4",
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
  "flightNumber": "P47123",
  "movementType": "ARRIVAL",
  "aircraftReg": "5N-BXX",
  "aircraftType": "B737",
  "bayName": "BAY 04",
  "soulsOnBoard": 112,
  "scheduledTime": "09:30:00",
  "actualTime": "2026-05-07T09:42:00.000Z",
  "date": "2026-05-07T00:00:00.000Z"
}
```

Success response: `201 Created`

```json
{
  "message": "Flight operation created successfully",
  "data": {
    "id": "clxop123",
    "flightNumber": "P47123",
    "movementType": "ARRIVAL",
    "airlineId": null,
    "aircraftId": "clxair123",
    "airportId": null,
    "bayId": "clxbay123",
    "soulsOnBoard": 112,
    "scheduledTime": "09:30:00",
    "actualTime": "2026-05-07T09:42:00.000Z",
    "delayMinutes": null,
    "delayStatus": null,
    "date": "2026-05-07T00:00:00.000Z",
    "createdById": "clxuser123",
    "createdAt": "2026-05-07T09:10:00.000Z",
    "updatedAt": "2026-05-07T09:10:00.000Z"
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

Frontend notes:

- Prefer `PATCH /upsert` for the editable daily table.
- `POST /` is better suited for manual or secondary workflows.
- The response is the raw Prisma `flightOperation` record.

### `GET /api/v1/flight-operations/history`

Returns historical live flight-operation records with optional filtering and pagination.

Query parameters:

- `startDate`: expected format `YYYY-MM-DD`
- `endDate`: expected format `YYYY-MM-DD`
- `page`: optional, default `1`
- `limit`: optional, default `20`
- `movementType`: optional, `ARRIVAL` or `DEPARTURE`
- `airlineCode`: optional string
- `status`: optional string
- `search`: optional string, matched against `flightNumber`

Example request:

```text
GET /api/v1/flight-operations/history?startDate=2026-05-01&endDate=2026-05-07&page=1&limit=20&movementType=ARRIVAL&airlineCode=P4&search=P4&status=ON_TIME
```

Success response: `200 OK`

```json
{
  "message": "Flight history retrieved successfully",
  "data": [
    {
      "id": "clxop123",
      "flightNumber": "P47123",
      "movementType": "ARRIVAL",
      "airlineId": "clxairl123",
      "aircraftId": "clxair123",
      "airportId": "clxairp123",
      "bayId": "clxbay123",
      "soulsOnBoard": 112,
      "scheduledTime": "09:30:00",
      "actualTime": "2026-05-07T09:42:00.000Z",
      "delayMinutes": 12,
      "delayStatus": "MINOR_DELAY",
      "date": "2026-05-07T00:00:00.000Z",
      "createdById": "clxuser123",
      "createdAt": "2026-05-07T09:10:00.000Z",
      "updatedAt": "2026-05-07T09:42:30.000Z",
      "airline": {
        "id": "clxairl123",
        "name": "Air Peace",
        "code": "P4",
        "createdAt": "2026-04-01T09:00:00.000Z",
        "updatedAt": "2026-04-01T09:00:00.000Z"
      },
      "aircraft": {
        "id": "clxair123",
        "registrationNumber": "5N-BXX",
        "type": "B737",
        "maxCapacity": 140,
        "airlineId": "clxairl123",
        "createdAt": "2026-04-01T09:00:00.000Z",
        "updatedAt": "2026-04-01T09:00:00.000Z"
      },
      "bay": {
        "id": "clxbay123",
        "name": "BAY 04",
        "code": "B04",
        "createdAt": "2026-04-01T09:00:00.000Z",
        "updatedAt": "2026-04-01T09:00:00.000Z"
      },
      "airport": {
        "id": "clxairp123",
        "name": "Lagos",
        "code": "LOS",
        "createdAt": "2026-04-01T09:00:00.000Z",
        "updatedAt": "2026-04-01T09:00:00.000Z"
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

Response notes:

- This endpoint returns raw `flightOperation` rows with full related `airline`, `aircraft`, `bay`, and `airport` objects when those relations exist.
- Date filtering is applied using Lagos-day boundaries derived from `startDate` and `endDate`.
- `search` currently matches only `flightNumber`.

Frontend notes:

- Use this endpoint for reporting and historical views.
- The current implementation does not explicitly validate missing or malformed date query parameters before building the query.

## Related Dashboard Endpoint

### `GET /api/v1/dashboard/today-summary`

The dashboard route returns metrics derived from live daily-board rows and the latest archive snapshot.

Auth:

- Requires `Authorization: Bearer <access_token>`.
- Requires `ADMIN`, `SUPERVISOR`, or `OPS_STAFF`.

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
    },
    "soulsOnBoard": {
      "arrivals": 520,
      "departures": 460
    },
    "airlineFlightBreakdown": [
      {
        "airlineCode": "P4",
        "airlineName": "Air Peace",
        "flights": [
          {
            "flightNumber": "P47123",
            "type": "ARRIVAL",
            "airport": "Lagos",
            "scheduled": "09:30:00",
            "actual": "2026-05-13T09:42:00.000Z",
            "aircraftReg": "5N-BXX",
            "bay": "BAY 04",
            "soulsOnBoard": 112
          }
        ]
      },
      {
        "airlineCode": null,
        "airlineName": null,
        "flights": [
          {
            "flightNumber": "UNKNOWN123",
            "type": "DEPARTURE",
            "airport": "Abuja",
            "scheduled": "13:00:00",
            "actual": null,
            "aircraftReg": null,
            "bay": null,
            "soulsOnBoard": 0
          }
        ]
      }
    ]
  }
}
```

Response notes:

- `currentDay` is built from today's schedule rows merged with matching live operations.
- `archiveDay` is built from the current contents of `archivedDailyOperation`.
- `soulsOnBoard.arrivals` is the total SOB across current-day arrival rows.
- `soulsOnBoard.departures` is the total SOB across current-day departure rows.
- `airlineFlightBreakdown` groups current-day rows by airline and includes per-flight display details.
- Each `airlineFlightBreakdown[].flights[]` item contains `flightNumber`, `type`, `airport`, `scheduled`, `actual`, `aircraftReg`, `bay`, and `soulsOnBoard`.
- `soulsOnBoard` on the per-flight breakdown defaults to `0` when no live operation SOB value exists yet.

Frontend notes:

- `airlineFlightBreakdown` is based on the current live board only, not the archived snapshot.
- `airlineName` is resolved from airline code when possible.
- Rows without an airline code are grouped under an `UNKNOWN` bucket internally; the returned group may contain `null` values for `airlineCode` and `airlineName`.
