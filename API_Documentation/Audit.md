# Audit API Documentation

## Overview
The audit API exposes the system action log for monitoring user activity and operational changes. The current backend mount is:

```text
/api/v1/audit-logs
```

## Authentication and access

All audit endpoints require:

```http
Authorization: Bearer <access_token>
```

Allowed roles:

- `ADMIN`
- `SUPERVISOR`

This matches the route setup in `src/routes/audit.route.ts`.

## Endpoint

### `GET /api/v1/audit-logs`

Retrieves paginated audit logs with optional filtering.

Query parameters:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Records per page |
| `module` | string | - | Filter logs by module |
| `action` | string | - | Filter logs by action type |
| `userId` | string | - | Filter by user ID |
| `startDate` | string | - | Start date in `YYYY-MM-DD` |
| `endDate` | string | - | End date in `YYYY-MM-DD` |
| `search` | string | - | Search text in log description |

Example:

```http
GET /api/v1/audit-logs?page=1&limit=20&module=USER&action=CREATE&startDate=2026-05-01&endDate=2026-05-08
Authorization: Bearer <token>
```

Success response: `200 OK`

```json
{
  "message": "Audit logs retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "module": "USER",
      "action": "CREATE",
      "description": "New user created",
      "userId": "user-uuid",
      "createdAt": "2026-05-08T10:30:00Z",
      "user": {
        "id": "user-uuid",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "ADMIN"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Common error responses

- `401 Unauthorized`: missing or invalid token.
- `403 Forbidden`: user does not have `ADMIN` or `SUPERVISOR` access.
- Invalid date query values are not validated by the endpoint and may reach the global error handler as `500 Internal Server Error`.

## Notes

- Audit records are associated with the actor via `userId` and nested `user` data.
- Date filtering is applied only when both `startDate` and `endDate` are supplied; both use `YYYY-MM-DD` and are interpreted as Lagos calendar dates.
- Each returned audit record may also include `entityType`, `entityId`, `metadata`, `ipAddress`, and `userAgent` when those values were recorded.
- Current operation-related actions include `UPSERT_OPERATION`, `CANCEL_OPERATION`, `UPDATE_ARCHIVED_OPERATION`, `CANCEL_ARCHIVED_OPERATION`, `ARCHIVE_DAILY_FLIGHTS_OPERATIONS`, and `REFRESH_DAILY_FLIGHTS`. Flight operation actions use module `FLIGHT_OPERATIONS`; FIDS trigger actions use module `FIDS`.
- `module` and `action` are free-form strings in the stored logs, so UI filtering should be tolerant of the values used by the service.
- The route currently excludes `OPS_STAFF` and `OPS_PERSONNEL` from audit access.
