# Hospital Management System

## Structure

```text
hospital-management-system/
├── backend/     # Node.js + Express + Sequelize REST API
└── frontend/    # React.js (Vite) client
```

## Features

* OPD / IPD admissions with real-time ward & bed allocation
* Doctor, staff & patient management with role-based dashboards
* Appointment booking & scheduling
* Billing & payment tracking
* Reports & analytics with charts
* System-wide audit logs
* Bed assignments sync instantly to patient & doctor dashboards

## Tech Stack

* **Frontend:** React.js, Vite, Axios, JWT-based auth context
* **Backend:** Node.js, Express.js, Sequelize, JWT authentication, REST APIs

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
# or: node server.js
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```


## License

For educational / portfolio use.

---

## Merge Notes (Login/Register pages preserved from a different build)

This codebase is the full **Hospital-Management-System-main** project as-is, with two exceptions: the **Login** and **Register** (`frontend/src/pages/Login.jsx` / `Register.jsx`) pages were preserved unchanged from a different, more feature-rich build, per explicit request.

### Backend

* `models/User.js` — the `role` ENUM was extended to also accept `nurse`, `pharmacist`, `lab_technician`, `admin_clerk`, and `housekeeping`.
* `controllers/authController.js` — `register` now reads `role` from the request body and accepts the extra doctor fields (`specialization`, `departmentId`, `workingHours`) sent by the sign-up form.
* `routes/publicRoutes.js` — provides an unauthenticated `GET /api/public/departments` endpoint for the sign-up form's department dropdown.

### Frontend

* `pages/Login.jsx` and `pages/Register.jsx` — preserved pages with style isolation.
* `styles/hms-auth-scope.css` — keeps Login/Register styles isolated from the rest of the application.
* `package.json` — added `lucide-react`, `react-hook-form`, and `react-hot-toast`.
* `App.jsx` — added `<Toaster />` from `react-hot-toast`.
