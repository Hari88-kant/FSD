# Smart EB Connect ⚡
**Location-Based Electricity Fault Reporting & Technician Assistance Web Application**  
*Full-Stack Development (FSD) Project — React.js • Node.js + Express.js • MongoDB*

---

## 1. Overview & Scope Boundary
**Smart EB Connect** allows residential and commercial customers to report power outages, voltage fluctuations, smart meter faults, and service line issues, optionally sharing consented GPS coordinates or a manual fallback address. Registered technicians can manage their availability, view nearby or assigned complaints, accept/reject requests, and update progress through a controlled state machine (`pending → assigned → accepted → on_the_way → in_progress → resolved`). Administrators have full visibility over users, technicians, and complaints.

> **Important Scope & Safety Notice:** This software-only academic prototype does not include ESP32/IoT hardware sensors and does not connect to an official government electricity board dispatch system. For sparking wires, exposed live conductors, or burning smells, the UI and API display an immediate safety warning instructing users to stay clear and contact their official utility helpline (`1912`) or emergency services (`112`).

---

## 2. Verified Environment (Apple Silicon macOS)
- **Architecture**: `arm64` (Apple Silicon)
- **Homebrew**: `7.0.10`
- **Node.js / npm**: `v26.12.0` / `11.20.0`
- **Git**: `2.54.0`
- **Database**: MongoDB Community Server `9.0.4` (`mongodb://127.0.0.1:27017/smart_eb_connect`)

---

## 3. Quick Start (Automated One-Command Setup)

From the root of the extracted `smart-eb-connect` folder:

```bash
chmod +x setup.sh
./setup.sh
```

Or run the steps manually:

### Step 1: Ensure MongoDB is running
```bash
brew services start mongodb-community
```

### Step 2: Configure & Start the Express Backend (`server/`)
```bash
cd server
cp .env.example .env
npm install
npm run seed    # Seeds Admin, 2 Customers, 3 Technicians, and 3 sample Complaints
npm test        # Runs automated Node + Supertest API test suite against local MongoDB
npm run dev     # Starts API server on http://localhost:5000
```

### Step 3: Start the React + Vite Frontend (`client/`)
Open a second terminal window:
```bash
cd client
npm install
npm run dev     # Starts React UI on http://localhost:5173
```

---

## 4. Seeded Demo Accounts
All seeded accounts use the password: **`Password123!`**

| Role | Name | Email | Default Coordinates / Zone |
| :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@smarteb.local` | Full System Access |
| **Customer 1** | Ananya Sharma | `ananya@smarteb.local` | Electronic City / Chandapura |
| **Customer 2** | Rohan Gowda | `rohan@smarteb.local` | Jigani / Anekal |
| **Technician 1** | Karthik Murthy | `karthik.tech@smarteb.local` | Electronic City (`12.8452, 77.6602`) |
| **Technician 2** | Suresh Babu | `suresh.tech@smarteb.local` | Anekal Town (`12.7109, 77.6953`) |
| **Technician 3** | Prashanth Rao | `prashanth.tech@smarteb.local` | HSR Layout (`12.9121, 77.6446`) |

---

## 5. Project Structure
```text
smart-eb-connect/
├── .gitignore
├── README.md
├── setup.sh
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE_AND_DB.md
│   └── TEST_PLAN.md
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── complaintController.js
│   │   │   └── technicianController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   ├── Complaint.js
│   │   │   ├── TechnicianProfile.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── complaintRoutes.js
│   │   │   └── technicianRoutes.js
│   │   ├── utils/
│   │   │   ├── errors.js
│   │   │   └── haversine.js
│   │   ├── app.js
│   │   ├── seed.js
│   │   └── server.js
│   └── tests/
│       └── api.test.js
└── client/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/client.js
        ├── components/
        │   ├── MapPicker.jsx
        │   ├── Navbar.jsx
        │   └── SafetyBanner.jsx
        ├── context/AuthContext.jsx
        ├── pages/
        │   ├── AdminDashboard.jsx
        │   ├── ComplaintDetailPage.jsx
        │   ├── CustomerDashboard.jsx
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   └── TechnicianDashboard.jsx
        ├── App.jsx
        ├── index.css
        └── main.jsx
```

---

## 6. Troubleshooting
- **`503 DATABASE_UNAVAILABLE`**: Verify MongoDB is running via `brew services list` and start it with `brew services start mongodb-community`.
- **Port 5000 in use on macOS (AirPlay Receiver)**: Change `PORT=5001` in `server/.env` and update `client/vite.config.js` proxy target to `http://localhost:5001`.
- **Browser GPS Permission Denied**: The UI automatically falls back to manual address entry and interactive click-on-map coordinate selection.
