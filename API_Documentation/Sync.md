# Sync Operations API Documentation

This document covers the endpoints that refresh the daily FIDS-backed schedule and manage archive snapshot creation during sync.

Base path:

```text
/api/v1/operations/sync-day
```

## Authentication and access

All sync endpoints require:

```http
Authorization: Bearer <access_token>
```

Allowed roles:

- `ADMIN`
- `SUPERVISOR`
- `OPS_STAFF`

The sync routes do not include `OPS_PERSONNEL` in their allow-list.

## Endpoints

### `POST /api/v1/operations/sync-day`

Runs the full daily sync flow.

Flow behavior:

- Fetches normalized FIDS rows.
- Computes the current Lagos operational day.
- If the schedule table already contains rows, creates a new archive snapshot before replacing them.
- Deletes the current `dailyFlightSchedule` rows.
- Inserts the refreshed FIDS-backed rows for the active day.

Success response: `200 OK`

```json
{
  "message": "Operations archived successfully"
}
```

Important notes:

- This endpoint is a trigger endpoint, not a fetch endpoint.
- It can replace the active archive snapshot, since it calls `createArchiveSnapshot` before refreshing the live table.
- If the FIDS source returns no flights, the service exits early without changing the schedule or archive and the endpoint still returns success.

### `POST /api/v1/operations/sync-day/refresh`

Refreshes only the current daily schedule from FIDS without creating a new archive snapshot first.

Success response: `200 OK`

```json
{
  "message": "Daily operations synced successfully"
}
```

Important notes:

- This refresh updates only the live runtime schedule table.
- It does not create or replace the archive snapshot.
- It is intended for a schedule-only update when the current archive copy should remain untouched.

## Audit logging

Both triggers create a non-blocking audit log entry in module `FIDS` with the triggering user's ID, IP address, and user agent when available:

| Endpoint | Action |
| --- | --- |
| `POST /api/v1/operations/sync-day` | `ARCHIVE_DAILY_FLIGHTS_OPERATIONS` |
| `POST /api/v1/operations/sync-day/refresh` | `REFRESH_DAILY_FLIGHTS` |

## Related flow notes

- After either sync endpoint succeeds, `/api/v1/flight-operations/daily` reads from the refreshed `dailyFlightSchedule` table.
- When FIDS returns flights and an existing schedule is present, `POST /api/v1/operations/sync-day` replaces the archive snapshot before updating the live schedule.
- `POST /api/v1/operations/sync-day/refresh` updates only the live schedule and leaves the current archive snapshot as-is.

## Common errors

- `401 Unauthorized`: missing or invalid token.
- `403 Forbidden`: insufficient permissions.
- `500 Internal Server Error`: internal sync failure or datasource issue.
- The general API limiter allows up to 500 requests per 15-minute window per IP; a rejected request returns `429 Too Many Requests`.
