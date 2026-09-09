# Hospital Management System — Frontend

React (Vite) single-page app. Talks to the backend REST API.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and point it at your running backend:
   ```
   cp .env.example .env
   ```
3. Start the dev server:
   ```
   npm run dev
   ```
   App runs at `http://localhost:5173` (or the next free port — check your
   terminal output). Make sure the backend is running at the URL set in
   `VITE_API_URL` (default `http://localhost:5001/api`).

## Roles

- **Patient** — registers via `/register`, browses/searches doctors, books
  and reschedules appointments, edits their own profile (including
  emergency contact, allergies, vaccination history), uploads documents,
  downloads prescriptions and invoices as PDF, views their bills.
- **Doctor** — views their patients and appointments, confirms/completes
  visits with diagnosis + notes + prescription, manages their own
  availability/working hours, views OPD/IPD records and bed status.
- **Receptionist** — manages patients (including walk-in registration),
  books appointments on a patient's behalf, manages OPD/IPD records and
  bed assignment, generates bills and records payments, views reports.
- **Admin** — everything above, plus creating staff accounts, a staff
  directory (activate/deactivate/remove any account), managing the room/
  bed inventory, refunding bills, and viewing the system-wide audit log
  and full reports suite.

Seed logins (created by `npm run seed` in the backend):
`admin@hospital.com` / `Admin@123`, `reception@hospital.com` /
`Reception@123`, `sarah.mitchell@hospital.com` / `Doctor@123`.

## Notable features

- Dark/light theme toggle (persisted, no flash on reload)
- Admin dashboard with real charts (7-day appointment trend, status
  breakdown) via `recharts`
- Client-side PDF generation via `jspdf` for prescriptions and invoices
- Patient/doctor/staff search with debounced queries
- Document upload/download per patient (JPG/PNG/WEBP/PDF)
- Real bed inventory — IPD admissions pick from currently available beds,
  which free up automatically on discharge
- Reports page with CSV export for tabular reports
