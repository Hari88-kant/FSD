# Smart EB Connect — REST API Documentation

All endpoints return a consistent JSON envelope:
- **Success**: `{ "success": true, "data": { ... } }`
- **Error**: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "Readable message" } }`

## 1. System & Health
### `GET /api/health`
- **Access**: Public
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "service": "smart-eb-connect-api",
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-10-26T08:00:00.000Z"
  }
}
```

## 2. Authentication
### `POST /api/auth/register`
- **Access**: Public (`customer` or `technician` only; `admin` role is rejected with `400 VALIDATION_ERROR`)
- **Request Body**:
```json
{
  "name": "Ananya Sharma",
  "email": "ananya@smarteb.local",
  "phone": "+91-9845011122",
  "password": "Password123!",
  "role": "customer"
}
```

### `POST /api/auth/login`
- **Access**: Public
- **Request Body**: `{ "email": "ananya@smarteb.local", "password": "Password123!" }`

### `GET /api/auth/me`
- **Access**: Authenticated (`Bearer <JWT>`)

## 3. Complaints CRUD & Workflow
### `GET /api/complaints`
- **Access**: Authenticated (Customers see own complaints; Technicians see assigned + unassigned pending; Admins see all; supports `?status=&problemType=&page=&limit=`)

### `POST /api/complaints`
- **Access**: Customer
- **Request Body**:
```json
{
  "problemType": "power_outage",
  "description": "Complete phase outage across 3rd Cross since 10:30 AM.",
  "address": "42, 3rd Cross, Electronic City",
  "lat": 12.8465,
  "lng": 77.6630
}
```

### `GET /api/complaints/:id`
- **Access**: Complaint Owner, Assigned Technician, or Admin

### `PATCH /api/complaints/:id`
- **Access**: Role/State-based (`accepted → on_the_way → in_progress → resolved` for assigned technician; cancellation for customer; administrative override for admin)

### `DELETE /api/complaints/:id`
- **Access**: Customer (for own `pending`/`assigned` complaint) or Admin; performs audit-safe soft cancellation (`status: "cancelled"`).

### `POST /api/complaints/:id/assign`
- **Access**: Admin or Complaint Owner
- **Request Body**: `{ "technicianId": "<User._id>" }`

### `POST /api/complaints/:id/accept`
- **Access**: Technician (enforces server-side check preventing double acceptance with `409 ALREADY_ACCEPTED`)

### `POST /api/complaints/:id/reject`
- **Access**: Assigned Technician (returns complaint to `pending` and clears `technicianId` for reassignment)

## 4. Technicians & Geolocation
### `GET /api/technicians/nearby?lat=12.8452&lng=77.6602&radiusKm=50`
- **Access**: Authenticated
- **Behavior**: Returns active, available technicians sorted nearest-first by straight-line Haversine distance (`distanceKm`), including a disclaimer that road travel distance/time may differ.

### `PATCH /api/technicians/me/availability`
- **Access**: Technician (`{ "isAvailable": true }`)

### `PATCH /api/technicians/me/location`
- **Access**: Technician (`{ "lat": 12.8452, "lng": 77.6602 }` — stored in MongoDB GeoJSON `[longitude, latitude]` order)

## 5. Administration
### `GET /api/admin/summary`
- **Access**: Admin
- **Returns**: Dashboard counts (`totalUsers`, `availableTechnicians`, `pendingComplaints`, `activeComplaints`, `resolvedComplaints`) and user/technician lists.

### `PATCH /api/admin/users/:id`
- **Access**: Admin (`{ "isActive": false, "role": "technician" }`)
