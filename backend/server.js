require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { sequelize, connectDB } = require("./config/db");
require("./models"); // registers associations

const authRoutes = require("./routes/authRoutes");
const publicRoutes = require("./routes/publicRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const bedRoutes = require("./routes/bedRoutes");
const billRoutes = require("./routes/billRoutes");
const staffRoutes = require("./routes/staffRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Make sure local data/uploads folders exist
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const start = async () => {
  await connectDB();
  // alter:true lets existing installs pick up new tables/columns (Bed,
  // Bill, Admission.bedId, etc.) without deleting the old database file.
  // Note: plain sync() only creates tables that don't exist yet - it never
  // modifies existing ones. This is intentional: Sequelize's SQLite "alter"
  // mode rebuilds whole tables under the hood (SQLite has no ALTER COLUMN),
  // and that rebuild path is unreliable with ENUM columns across repeated
  // runs. If you pull a version with schema changes, delete data/hospital.sqlite
  // and run `npm run seed` again to get a fresh database on the new schema.
  await sequelize.sync();

  // Reflects any http(s)://localhost:<port> origin. Vite sometimes picks a
  // different port (5174, 5175...) if 5173 is busy, so we don't hardcode one.
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || /^https?:\/\/localhost:\d+$/.test(origin)) {
          return callback(null, true);
        }
        return callback(null, process.env.CLIENT_URL === origin);
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Hospital Management System API is running" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/patients", patientRoutes);
  app.use("/api/doctors", doctorRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/admissions", admissionRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/audit-logs", auditLogRoutes);
  app.use("/api/beds", bedRoutes);
  app.use("/api/bills", billRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/reports", reportRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  // Global error handler (also catches Multer file-validation errors)
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ message: err.message || "Something went wrong on the server" });
  });

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
