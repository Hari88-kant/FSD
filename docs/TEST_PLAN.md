# Smart EB Connect — Verification & Test Plan

## 1. Automated API Integration Tests (`server/tests/api.test.js`)
Run via `cd server && npm test`:
1. **Health Endpoint**: Confirms `GET /api/health` returns HTTP 200 and database state.
2. **Input Validation & Admin Registration Guard**: Verifies invalid payloads return `400 VALIDATION_ERROR` and blocks public registration with `role: 'admin'`.
3. **Password Hashing**: Verifies `User.passwordHash` in MongoDB is stored as a `bcryptjs` hash (`$2...`) and never plaintext.
4. **Graceful Missing/Denied GPS Fallback**: Submits a complaint without coordinates using manual `address` fallback and verifies HTTP 201 persistence.
5. **Customer Isolation**: Verifies Customer B receives `403 FORBIDDEN` when requesting Customer A's complaint.
6. **Haversine Distance Sorting**: Queries `/api/technicians/nearby` with known Electronic City coordinates and confirms technicians are returned nearest-first.
7. **Technician Assignment, Double-Acceptance Prevention & State Machine**:
   - Assigns technician → verifies uninvolved technician cannot accept (`403`) → assigned technician accepts (`200`) → repeat accept is rejected (`409 ALREADY_ACCEPTED`) → invalid jump (`accepted → resolved`) is rejected (`400 INVALID_TRANSITION`) → valid progression (`accepted → on_the_way → in_progress → resolved`) succeeds.
8. **Admin RBAC Protection**: Verifies non-admin receives `403 FORBIDDEN` on `/api/admin/summary` while admin receives full system metrics.

## 2. Manual End-to-End Browser Demo Script
1. **Customer Flow**: Log in as `ananya@smarteb.local` (`Password123!`), click **Share Browser GPS Location** (or click the Leaflet map), inspect the nearest available technicians table, submit a new complaint, and click **Request Nearest Tech**.
2. **Safety Warning Check**: Select `Sparking / Exposed Wire / Burning Smell` in the problem category dropdown and verify the red emergency safety warning appears immediately.
3. **Technician Flow**: Log in as `karthik.tech@smarteb.local`, toggle availability, update GPS coordinates, click **Accept** on the assigned complaint, and progress through **Mark On The Way → Start Repair → Mark Resolved**.
4. **Admin Flow**: Log in as `admin@smarteb.local`, review summary counters, filter complaints by status, reassign a pending complaint, and test deactivating/activating a user account.
