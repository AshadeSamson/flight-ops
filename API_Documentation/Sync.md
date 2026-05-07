# Sync Operations API Documentation

This document covers the manual sync endpoint that refreshes the daily FIDS-backed schedule and archives the previous snapshot.

Base path:

```text
/api/v1/operations/sync-day
```

## Authentication and Access

The sync endpoint requires:

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

## Endpoint

### `POST /api/v1/operations/sync-day`

Triggers a manual sync of `dailyFlightSchedule` from the FIDS source.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Operations synced successfully"
}
```

What the sync does:

- Fetches normalized flight data from the FIDS pipeline.
- Computes the current Lagos operational day.
- If there are existing rows in `dailyFlightSchedule`, creates a fresh archive snapshot first.
- Clears all existing `dailyFlightSchedule` rows.
- Inserts the latest normalized flights for the current day.

Archive snapshot behavior:

- Before replacing the schedule cache, the service calls `createArchiveSnapshot(snapshotDate)`.
- The archive snapshot is created from `getDailyOperations(date, 1, 10000)`.
- The snapshot process currently deletes all previous rows from `archivedDailyOperation` before inserting the new snapshot.

Frontend notes:

- This endpoint is a trigger endpoint, not a data-fetch endpoint.
- The response only confirms whether the sync completed successfully.
- If the FIDS source returns no flights, the service exits early and the response still returns success.
- Running sync can replace the current daily schedule cache and refresh the archive snapshot.

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

## Related Flow Notes

- After a successful sync, `/api/v1/flight-operations/daily` reads from the refreshed `dailyFlightSchedule` table.
- Because the archive snapshot is recreated during sync, `/api/v1/archive-operations` reflects the most recently archived daily snapshot, not a growing history of many days.
