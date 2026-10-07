# Flight Operations API Documentation

This document covers the flight operations endpoints exposed for frontend integration.

Base path:

```text
/api/v1/flight-operations
```

## Authentication and access

All endpoints in this module require:

```http
Authorization: Bearer <access_token>
```

Allowed roles:

- `ADMIN`
- `SUPERVISOR`
- `OPS_STAFF`
- `OPS_PERSONNEL`

This is enforced by each route using `requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF", "OPS_PERSONNEL")`.

## Core logic rules

The current operation services apply the following rules:

- `movementType` must be `ARRIVAL` or `DEPARTURE`.
- `date` for the daily board is expected as `YYYY-MM-DD`.
- `scheduledTime` should be in `HH:mm:ss` format.
- `actualTime` is an ISO timestamp in the create/upsert schemas. `boardingTime` is accepted as a string and stored as `boardingCall`.
- `delayStatus` can be `PENDING`, `ON_TIME`, `MINOR_DELAY`, `DELAYED`, or `CANCELLED`.
- Upsert recalculates delay status from `scheduledTime` and `actualTime`; a requested `CANCELLED` status clears `actualTime`, `soulsOnBoard`, and `delayMinutes`.
- Direct create requires `scheduledTime` and does not apply the upsert endpoint's delay calculation or reference-data resolution for airline/airport.
- The schedule and live operation are aligned around the Lagos operational day, not a UTC calendar day.
- Upsert can use the matching schedule row's `scheduledTime` when one is not supplied; if neither exists, it returns `400`.

## Endpoints

### `GET /api/v1/flight-operations/daily`

Returns the current daily board by merging schedule rows with matching live flight-operation rows.

Query parameters:

- `date`: required, `YYYY-MM-DD`
- `page`: optional, default `1`
- `limit`: optional, default `20`; use `all` to return all matching rows
- `movementType`: optional, `ARRIVAL` or `DEPARTURE`
- `airlineCode`: optional filter
- `search`: optional search across `flightNumber` and `airportName`
- `status`: optional filter such as `ON_TIME`, `MINOR_DELAY`, `DELAYED`, `PENDING`, or `CANCELLED`

Example:

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
      "date": "2026-05-07T00:00:00.000Z",
      "flightNumber": "P47123",
      "airlineCode": "P4",
      "airportName": "Lagos",
      "scheduledTime": "09:30:00",
      "movementType": "ARRIVAL",
      "operationId": "clxop123",
      "soulsOnBoard": 112,
      "actualTime": "2026-05-07T09:42:00.000Z",
      "boardingTime": "2026-05-07T09:10:00.000Z",
      "aircraftReg": "5N-BXX",
      "aircraftType": "B737",
      "bayName": "BAY 04",
      "delayMinutes": 12,
      "delayStatus": "MINOR_DELAY",
      "remarks": "Gate change confirmed"
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

### `PATCH /api/v1/flight-operations/upsert`

Creates or updates a live `flightOperation` identified by `flightNumber + date + movementType`.

Request body example:

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
  "boardingTime": "2026-05-07T09:10:00.000Z",
  "delayStatus": "MINOR_DELAY",
  "remarks": "Gate change confirmed",
  "date": "2026-05-07T00:00:00.000Z"
}
```

Resolution logic:

- Airline resolution order is: request `airlineCode`, then schedule `airlineCode`, then the first token of `flightNumber`.
- If no airline code can be resolved and the aircraft record already exists, the aircraft's airline is used. A resolved but unknown airline code returns `404`.
- Airport resolution order is: request `airportCode`, then schedule `airportCode`, then request/schedule `airportName`.
- The service checks the current matching schedule row before falling back to the request values.
- If `delayStatus` is `CANCELLED`, the service clears `actualTime` and `soulsOnBoard`, and sets `delayMinutes` to `null`.
- For non-cancelled records, delay is recalculated only when `scheduledTime` is supplied. A schedule match can supply the required scheduled time for creation.
- Successful upserts create a non-blocking audit record (`UPSERT_OPERATION` or `CANCEL_OPERATION`, module `FLIGHT_OPERATIONS`) and enqueue a flight-operation replication event.

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
    "boardingCall": "2026-05-07T09:10:00.000Z",
    "delayMinutes": 12,
    "delayStatus": "MINOR_DELAY",
    "remarks": "Gate change confirmed",
    "date": "2026-05-07T00:00:00.000Z",
    "createdById": "clxuser123",
    "createdAt": "2026-05-07T09:10:00.000Z"
  }
}
```

### `GET /api/v1/flight-operations/schedule`

Looks up one flight in the current daily schedule for a Lagos operational day.

Required query parameters:

- `flightNumber`
- `movementType`: `ARRIVAL` or `DEPARTURE`
- `date`: date used to select the Lagos operational day

Example:

```text
GET /api/v1/flight-operations/schedule?flightNumber=P47123&movementType=ARRIVAL&date=2026-05-07
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

Returns `400` if a required query parameter is missing and `404` with `"Flight not found in schedule"` if no matching row exists.

### `POST /api/v1/flight-operations`

Creates a flight operation row directly.

This endpoint creates a new operation directly; unlike `/upsert`, it does not resolve airline/airport fields from request data or the schedule, calculate delay status, or return the included reference relations.

Required request fields are `flightNumber` (at least 2 characters), `movementType`, `scheduledTime` (`HH:mm:ss`), and `date` (ISO datetime). Optional fields are `aircraftReg`, `aircraftType`, `bayName`, positive integer `soulsOnBoard`, ISO `actualTime`, `boardingTime`, and `remarks`. `aircraftReg` and `bayName` are resolved to existing records when supplied; `aircraftType` is accepted by validation but is not stored by this endpoint.

Success response: `201 Created`, with `{ "message": "Flight operation created successfully", "data": { ... } }`.

### `GET /api/v1/flight-operations/history`

Returns flight operations for an inclusive date range, using Lagos calendar-day boundaries.

Query parameters:

- `startDate` and `endDate`: required, `YYYY-MM-DD`
- `page`: optional, default `1`
- `limit`: optional, default `20`; use `all` to return all matching records
- `movementType`, `airlineCode`, `status`, and `search`: optional filters

`search` matches `flightNumber`; `status` is case-insensitive and may include `CANCELLED`.

## Access matrix

| Endpoint family | Allowed roles |
| --- | --- |
| `/api/v1/flight-operations/*` | `ADMIN`, `SUPERVISOR`, `OPS_STAFF`, `OPS_PERSONNEL` |

## Common errors

- `401 Unauthorized` for missing/invalid token.
- `403 Forbidden` for insufficient permissions.
- `400 Bad Request` for invalid request payloads or missing required fields/parameters. Invalid date values that reach date parsing may be reported by the global error handler as `500`.
