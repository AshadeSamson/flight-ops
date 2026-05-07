# Sync Operations API Documentation

This document covers the endpoints that refresh the daily FIDS-backed schedule and manage snapshot creation during sync.

Base path:

```text
/api/v1/operations/sync-day
```

## Authentication and Access

All sync endpoints require:

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

## Endpoints

### `POST /api/v1/operations/sync-day`

Runs the full daily sync flow.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Operations synced successfully"
}
```

What this sync does:

- Fetches normalized FIDS rows.
- Computes the current Lagos operational day.
- If `dailyFlightSchedule` already contains rows, creates a new archive snapshot first.
- Deletes all rows from `dailyFlightSchedule`.
- Inserts the new FIDS-backed rows for the current day.

Archive snapshot behavior:

- The sync flow calls `createArchiveSnapshot(snapshotDate)` before replacing the current schedule cache.
- Snapshot creation reads from `getDailyOperations(date, 1, 10000)`.
- Snapshot creation currently deletes all previous `archivedDailyOperation` rows before inserting the new snapshot.

Frontend notes:

- This is a trigger endpoint, not a data-fetch endpoint.
- The response only confirms whether the sync completed successfully.
- If the FIDS source returns no flights, the service exits early and the endpoint still returns success.
- Running this endpoint can overwrite the current archive snapshot.

Possible error responses:

- `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500,
  "path": "/api/v1/operations/sync-day",
  "timestamp": "2026-05-07T12:00:00.000Z"
}
```

### `POST /api/v1/operations/sync-day/refresh`

Refreshes the current daily schedule from FIDS without creating a new archive snapshot first.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Daily operations refreshed successfully"
}
```

What refresh does:

- Fetches normalized FIDS rows.
- Computes the current Lagos operational day.
- Deletes only the `dailyFlightSchedule` table contents.
- Inserts the new FIDS-backed rows for the current day.
- Does not create or replace `archivedDailyOperation`.

Frontend notes:

- Use this endpoint when you want a schedule-only refresh and do not want to overwrite the current archive snapshot.
- If the FIDS source returns no flights, the service exits early and the endpoint still returns success.

Possible error responses:

- `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500,
  "path": "/api/v1/operations/sync-day/refresh",
  "timestamp": "2026-05-07T12:00:00.000Z"
}
```

## Related Flow Notes

- After either sync endpoint succeeds, `/api/v1/flight-operations/daily` reads from the refreshed `dailyFlightSchedule` table.
- `POST /api/v1/operations/sync-day` refreshes the daily table and also replaces the latest archive snapshot.
- `POST /api/v1/operations/sync-day/refresh` refreshes only the live daily table and leaves the current archive snapshot untouched.
