# Hospital Management System

| Intern ID | Full Name | No. of Weeks | Project Name | Project Scope |
|---|---|---|---|---|
| CITS7634 | Nagisetty Mahitha Varshini | 8 Weeks | Hospital Management System (HMS) | Full-stack hospital management platform covering OPD/IPD admissions with real-time ward and bed allocation, doctor/staff/patient management with role-based dashboards (Admin, Receptionist, Doctor, Patient), appointment booking and scheduling, billing and payment tracking, examination-style reports and analytics with visual charts, and system-wide audit logs for accountability. |

A full-stack Hospital Management System with role-based dashboards for Admin, Receptionist, Doctor, and Patient.

## Structure

```
hospital-management-system/
├── backend/     # Node.js + Express + Sequelize REST API
└── frontend/    # React.js (Vite) client
```

## Features

- OPD / IPD admissions with real-time ward & bed allocation
- Doctor, staff & patient management with role-based dashboards
- Appointment booking & scheduling
- Billing & payment tracking
- Reports & analytics with charts
- System-wide audit logs
- Bed assignments sync instantly to patient & doctor dashboards

## Tech Stack

- **Frontend:** React.js, Vite, Axios, JWT-based auth context
- **Backend:** Node.js, Express.js, Sequelize, JWT authentication, REST APIs

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env   # fill in your own values
npm install
npm run dev             # or: node server.js
```

### Frontend
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL to your backend URL
npm install
npm run dev
```

## Roles

| Role | Access |
|---|---|
| Admin | Full access — staff, doctors, beds, billing, reports, audit logs |
| Receptionist | Patients, appointments, admissions, beds, billing |
| Doctor | Own patients, appointments, admissions |
| Patient | Own appointments, admissions, bills, documents |

## License

For educational / portfolio use.

---

## Merge Notes (Login/Register pages preserved from a different build)

This codebase is the full **Hospital-Management-System-main** project as-is, with two
exceptions: the **Login** and **Register** (`frontend/src/pages/Login.jsx` /
`Register.jsx`) pages were preserved unchanged from a different, more feature-rich build,
per explicit request. To make that swap actually work without touching anything else,
the following minimal, contained changes were made:

**Backend**
- `models/User.js` — the `role` ENUM was extended to also accept `nurse`, `pharmacist`,
  `lab_technician`, `admin_clerk`, `housekeeping` (the sign-up page's role picker offers
  9 roles; this app's Sidebar/Dashboard only have dedicated views for `admin`, `doctor`,
  `receptionist`, `patient` — the extra roles can register and log in, but will see a
  mostly empty dashboard until dedicated pages exist for them).
- `controllers/authController.js` — `register` now reads `role` from the request body
  (previously hardcoded to `"patient"`) and accepts the extra doctor fields
  (`specialization`, `departmentId`, `workingHours`) the preserved sign-up form sends.
  This app intentionally allows open self-registration into any role, including admin —
  fine for local/demo use, but lock this down before any real deployment.
- `routes/publicRoutes.js` (new) — a small, unauthenticated `GET /api/public/departments`
  endpoint that feeds the sign-up form's department dropdown. This app stores each
  doctor's department as a plain text column rather than a separate table, so this
  returns a small curated list rather than querying the database.

**Frontend**
- `pages/Login.jsx`, `pages/Register.jsx` — copied over unchanged except for one added
  CSS class (`hms-auth-scope`) on the root element, purely for style isolation (see next
  point). No visual or behavioral change.
- `styles/hms-auth-scope.css` (new) — the preserved pages use common class names
  (`.btn`, `.form-group`, `.input`) that this app's own `theme.css` *also* defines, with
  different rules, for its own pages. Every rule in this new stylesheet is nested under
  `.hms-auth-scope` so it can only ever apply inside the Login/Register pages and can
  never leak into or override the rest of the app's styling.
- `package.json` — added `lucide-react`, `react-hook-form`, `react-hot-toast` (used by
  the preserved pages).
- `App.jsx` — added `<Toaster />` from `react-hot-toast` so the preserved pages' error
  messages actually render.

Everything else — routing, all other pages, the Sidebar, the Express backend's
controllers/models/routes for patients, doctors, appointments, admissions, beds,
billing, staff, reports, audit logs — is untouched Hospital-Management-System-main code.
