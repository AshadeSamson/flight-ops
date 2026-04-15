# Reference Data API Documentation

This document covers the reference endpoints used to populate frontend dropdowns, selectors, and lookup data.

Base path:

```text
/api/v1/ref
```

## Authentication and Access

All reference endpoints require:

```http
Authorization: Bearer <access_token>
```

Access notes:

- Any authenticated user can access these endpoints.
- No special role restriction is applied beyond authentication.

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

- `404 Not Found`

```json
{
  "message": "User does not exist"
}
```

## Endpoints

### `GET /api/v1/ref/aircrafts`

Returns all aircraft reference records ordered by registration number.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Aircrafts retrieved successfully",
  "data": [
    {
      "id": "clxair123",
      "registrationNumber": "5N-BXX",
      "type": "B737",
      "maxCapacity": 140,
      "airlineCode": "Q9",
      "airlineName": "Green Africa"
    }
  ]
}
```

Frontend notes:

- Use `registrationNumber` for `aircraftReg` values sent to flight operation endpoints.
- `type` is useful for display, but the flight operation services currently map aircraft by `registrationNumber`, not by type.

### `GET /api/v1/ref/bays`

Returns all bay reference records ordered by name.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Bays retrieved successfully",
  "data": [
    {
      "id": "clxbay123",
      "name": "BAY 04",
      "code": "B04"
    }
  ]
}
```

Frontend notes:

- Use `name` for `bayName` values sent to flight operation endpoints.

### `GET /api/v1/ref/airports`

Returns all airport reference records ordered by name.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Airports retrieved successfully",
  "data": [
    {
      "id": "clxapt123",
      "name": "Murtala Muhammed International Airport",
      "code": "LOS"
    }
  ]
}
```

### `GET /api/v1/ref/airlines`

Returns all airline reference records ordered by name.

Request body:

- None

Success response: `200 OK`

```json
{
  "message": "Airlines retrieved successfully",
  "data": [
    {
      "id": "clxairline123",
      "name": "Green Africa",
      "code": "Q9"
    }
  ]
}
```

## Response Pattern

All reference endpoints return the same top-level response shape:

```json
{
  "message": "Human readable success message",
  "data": []
}
```

## Frontend Integration Notes

- These endpoints are lookup endpoints and do not take query params or request bodies.
- Use them to populate dropdowns before calling flight operations endpoints.
- For flight operation payloads, send `aircraftReg` using `aircrafts[].registrationNumber` and `bayName` using `bays[].name`.
