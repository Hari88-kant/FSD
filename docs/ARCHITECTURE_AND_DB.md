# Smart EB Connect — Architecture & Database Design

## 1. Three-Tier System Architecture
```text
+-----------------------------------------------------------------------+
|                        CLIENT TIER (React + Vite)                     |
|  - Role-Based Views: Customer / Technician / Admin Dashboards         |
|  - Leaflet + OpenStreetMap MapPicker & Browser Geolocation Fallback   |
|  - AuthContext (JWT Bearer Client) + Safety & Hazard Notice Banners   |
+-----------------------------------+-----------------------------------+
                                    | HTTP / JSON REST API (/api/*)
                                    v
+-----------------------------------------------------------------------+
|                     APPLICATION TIER (Node.js + Express)              |
|  - Security Middleware: Helmet, CORS, JWT Auth, Role Guard (RBAC)     |
|  - Validation & Error Layer: Zod Schemas + Centralized Error Handler  |
|  - Domain Services: Haversine Distance Ranking & State Machine Guard  |
+-----------------------------------+-----------------------------------+
                                    | Mongoose ODM
                                    v
+-----------------------------------------------------------------------+
|                       DATA TIER (MongoDB Community)                   |
|  - Collections: users, technicianprofiles, complaints                 |
|  - GeoJSON Point [longitude, latitude] with 2dsphere sparse indexes   |
+-----------------------------------------------------------------------+
```

## 2. Entity-Relationship (ER) & Schema Design

### `User` Collection
- `_id`: `ObjectId` (PK)
- `name`: `String` (required, 2–100 chars)
- `email`: `String` (required, unique, lowercase)
- `phone`: `String` (optional)
- `passwordHash`: `String` (bcrypt hash, `select: false`)
- `role`: `Enum['customer', 'technician', 'admin']`
- `isActive`: `Boolean` (default `true`)
- `createdAt`, `updatedAt`: `Date`

### `TechnicianProfile` Collection
- `_id`: `ObjectId` (PK)
- `userId`: `ObjectId` (FK → `User._id`, unique)
- `skills`: `String[]`
- `serviceAreas`: `String[]`
- `isAvailable`: `Boolean` (default `true`)
- `location`: `{ type: 'Point', coordinates: [longitude, latitude] }` (`2dsphere` sparse index)
- `lastLocationAt`: `Date`
- `rating`: `Number` (1–5)

### `Complaint` Collection
- `_id`: `ObjectId` (PK)
- `customerId`: `ObjectId` (FK → `User._id`, indexed)
- `problemType`: `Enum['power_outage', 'voltage_fluctuation', 'meter_fault', 'fuse_blown', 'billing_or_connection', 'sparking_or_exposed_wire', 'other']`
- `description`: `String` (10–2000 chars)
- `address`: `String` (optional manual fallback)
- `location`: `{ type: 'Point', coordinates: [longitude, latitude] }` (`2dsphere` sparse index)
- `technicianId`: `ObjectId` (FK → `User._id`, nullable, indexed)
- `status`: `Enum['pending', 'assigned', 'accepted', 'rejected', 'on_the_way', 'in_progress', 'resolved', 'cancelled']`
- `isHazardous`: `Boolean`
- `statusHistory`: `Array<{ status, changedBy, note, timestamp }>`
- `createdAt`, `updatedAt`: `Date`
