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
- `actualTime` and `boardingTime` are ISO timestamps when supplied.
- `boardingTime` is stored as `boardingCall`.
- `delayStatus` can be `PENDING`, `ON_TIME`, `MINOR_DELAY`, `DELAYED`, or `CANCELLED`.
- If `delayStatus` is `CANCELLED`, the backend clears `actualTime` and sets `delayMinutes` to `null`.
- For other states, the backend recalculates delay values from `scheduledTime` and `actualTime` when possible.
- The schedule and live operation are aligned around the Lagos operational day, not a UTC calendar day.
- If a matching schedule row is not found and no `scheduledTime` is supplied, the backend returns a `400` validation error.

## Endpoints

### `GET /api/v1/flight-operations/daily`

Returns the current daily board by merging schedule rows with matching live flight-operation rows.

Query parameters:

- `date`: required, `YYYY-MM-DD`
- `page`: optional, default `1`
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
      "boardingCall": "2026-05-07T09:10:00.000Z",
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
- If no airline is found and the aircraft record already exists, the aircraft's airline is used.
- Airport resolution order is: request `airportCode`, then schedule `airportCode`, then request/schedule `airportName`.
- The service checks the current matching schedule row before falling back to the request values.
- If `delayStatus` is `CANCELLED`, it clears `actualTime`, stores the cancelled status, and sets `delayMinutes` to `null`.
- For non-cancelled records, delay is recalculated when `scheduledTime` exists.

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

Returns the schedule rows used by the current Lagos operational day.

### `POST /api/v1/flight-operations`

Creates a flight operation row directly.

This endpoint uses the same operational rules as `PATCH /upsert`, but is a standard create endpoint and is also protected by the same role allow-list.

### `GET /api/v1/flight-operations/history`

Returns historical flight operation records associated with the current operational day and matching filters.

## Access matrix

| Endpoint family | Allowed roles |
| --- | --- |
| `/api/v1/flight-operations/*` | `ADMIN`, `SUPERVISOR`, `OPS_STAFF`, `OPS_PERSONNEL` |

## Common errors

- `401 Unauthorized` for missing/invalid token.
- `403 Forbidden` for insufficient permissions.
- `400 Bad Request` for invalid dates, payloads, or missing required flight fields.
