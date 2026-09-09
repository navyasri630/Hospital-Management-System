# Hospital Management System — Backend

Node.js + Express REST API with JWT authentication and four roles:
`admin`, `doctor`, `receptionist`, `patient`.

**Database: SQLite.** No MongoDB, no Docker, no separate database service to
install or start — data is stored in a single local file at
`data/hospital.sqlite`, created automatically the first time you run the app.
Uploaded files (documents, reports) are stored under `uploads/`.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
   (On Windows PowerShell, use `copy .env.example .env` instead of `cp`.)
3. Seed a default admin, receptionist, sample doctors, and a starter bed inventory:
   ```
   npm run seed
   ```
   Creates:
   - `admin@hospital.com` / `Admin@123`
   - `reception@hospital.com` / `Reception@123`
   - `sarah.mitchell@hospital.com` / `Doctor@123`
   - `james.okafor@hospital.com` / `Doctor@123`
   - `priya.nair@hospital.com` / `Doctor@123`
4. Start the server:
   ```
   npm run dev
   ```
   API runs at `http://localhost:5001/api`. Health check: `GET /api/health`.

The database file lives at `data/hospital.sqlite`. Delete that file any time
to reset the whole system back to empty (then run `npm run seed` again).
Startup uses `sequelize.sync({ alter: true })`, so pulling a newer version of
this backend onto an existing database will automatically add any new
tables/columns without you needing to delete anything.

## What's implemented

- **Auth**: register/login, JWT, bcrypt password hashing, forgot/reset
  password (dev mode — reset link is returned in the API response and
  logged to the console, since no email provider is configured)
- **Roles**: admin, doctor, receptionist, patient — each with scoped
  permissions on every route
- **Patients**: CRUD, search, medical history, allergies, vaccination
  history, emergency contact, document uploads (JPG/PNG/WEBP/PDF)
- **Doctors**: CRUD, department, specialization, working hours,
  availability toggle, search/filter
- **Appointments**: book, confirm, complete (with diagnosis/notes/
  prescription), cancel, reschedule, search/filter by status
- **OPD/IPD**: outpatient + inpatient records, discharge summaries, real
  bed assignment (see Rooms/Beds below)
- **Rooms/Beds**: a real bed inventory (ward, room type, status). IPD
  admissions pick from currently-available beds; the bed flips to
  "occupied" on admission and back to "available" on discharge
- **Billing**: generate itemized bills against a patient, record payment
  (cash/card/insurance — no live gateway is wired up), refunds, invoice
  history, downloadable PDF invoice (generated client-side)
- **Staff directory**: unified admin view of every doctor/receptionist/
  admin account, with activate/deactivate/remove
- **Dashboard stats**: role-aware counts + 7-day appointment trend +
  status breakdown, for the frontend's charts
- **Reports**: patient statistics, appointment report, revenue report,
  doctor performance, bed occupancy — all exposed as JSON the frontend
  renders and can export to CSV
- **Audit log**: every sensitive create/update/delete is recorded with
  actor, action, and target
- **File uploads**: `multer`-based, served statically from `/uploads`

## Not implemented (needs external services or is a large sub-system)

Pharmacy inventory, Lab test workflow, live payment gateway integration
(Stripe/Razorpay — the Bill model is ready for it), Staff attendance/
payroll/shift scheduling, Email/SMS notifications, AI features (chatbot,
symptom checker), Ambulance/blood bank/ICU tracking beyond bed status,
QR/barcode generation. The data model and route structure are consistent,
so any of these can be added the same way the existing modules were.

## API overview

| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register | Public — patient self sign-up |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Logged in |
| POST | /api/auth/create-staff | Admin only |
| POST | /api/auth/forgot-password | Public |
| POST | /api/auth/reset-password/:token | Public |
| GET/POST/PUT/DELETE | /api/patients | Admin/Doctor/Receptionist (read), Admin/Receptionist/self (write) |
| POST/GET/DELETE | /api/patients/:id/documents | Scoped to patient + staff |
| GET/PUT/DELETE | /api/doctors | Logged in (read), Admin/Receptionist/self (write) |
| POST/GET/PUT/DELETE | /api/appointments | Role-scoped |
| PUT | /api/appointments/:id/reschedule | Patient (own)/Admin/Receptionist |
| POST/GET/PUT/DELETE | /api/admissions | Role-scoped |
| GET/POST/PUT/DELETE | /api/beds | Admin (write), Admin/Receptionist/Doctor (read) |
| GET/POST/PUT/DELETE | /api/bills | Admin/Receptionist (write), self (read own) |
| GET/PUT/DELETE | /api/staff | Admin only |
| GET | /api/reports/* | Admin (all), Receptionist (patients/appointments/beds) |
| GET | /api/dashboard/stats | Logged in (role-aware response) |
| GET | /api/audit-logs | Admin only |

All protected routes require an `Authorization: Bearer <token>` header.
