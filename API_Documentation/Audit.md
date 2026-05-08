# Audit API Documentation

## Overview
The Audit API provides endpoints for retrieving audit logs of system operations. Audit logs track all significant actions performed in the system, including who performed the action, what was done, and when it occurred.

---

## Endpoints

### Get Audit Logs
Retrieve paginated audit logs with optional filtering capabilities.

**Endpoint:** `GET /audit`

**Authentication:** Required  
**Authorization:** Requires `ADMIN` or `SUPERVISOR` role

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 20 | Number of records per page |
| `module` | string | - | Filter logs by module (e.g., USER, FLIGHT_OPERATION) |
| `action` | string | - | Filter logs by action type (e.g., CREATE, UPDATE, DELETE) |
| `userId` | string | - | Filter logs by user ID |
| `startDate` | string | - | Start date for date range filter (format: YYYY-MM-DD) |
| `endDate` | string | - | End date for date range filter (format: YYYY-MM-DD) |
| `search` | string | - | Search in description field (case-insensitive) |

**Request Example:**
```http
GET /audit?page=1&limit=20&module=USER&action=CREATE&startDate=2026-05-01&endDate=2026-05-08
Authorization: Bearer <token>
```

**Response (200 OK):**
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
    "totalPages": 8
  }
}
```

**Response Fields:**
- `message` - Success message
- `data` - Array of audit log records
  - `id` - Unique identifier for the audit log
  - `module` - Module where the action was performed
  - `action` - Type of action performed
  - `description` - Detailed description of the action
  - `userId` - ID of the user who performed the action
  - `createdAt` - Timestamp when the action was performed
  - `user` - User object containing user details
    - `id` - User ID
    - `name` - User's full name
    - `email` - User's email address
    - `role` - User's role (ADMIN, SUPERVISOR, etc.)
- `meta` - Pagination metadata
  - `total` - Total number of audit logs matching filters
  - `page` - Current page number
  - `limit` - Records per page
  - `totalPages` - Total number of pages

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Authentication token is missing or invalid |
| 403 | Forbidden | User does not have ADMIN or SUPERVISOR role |
| 400 | Bad Request | Invalid query parameters |

---

## Common Use Cases

1. **Track user actions:** Filter by `userId` to see all actions performed by a specific user
2. **Monitor specific modules:** Use `module` filter to focus on specific features (e.g., flight operations)
3. **Date range analysis:** Use `startDate` and `endDate` for compliance reporting
4. **Search functionality:** Use `search` parameter to find logs mentioning specific text
5. **Pagination:** Combine `page` and `limit` for efficient data retrieval in large datasets
