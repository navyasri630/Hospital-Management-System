const express = require("express");
const router = express.Router();
const {
  patientStatistics,
  appointmentReport,
  revenueReport,
  doctorPerformance,
  bedOccupancy,
} = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/auth");

router.get("/patients", protect, authorize("admin", "receptionist"), patientStatistics);
router.get("/appointments", protect, authorize("admin", "receptionist"), appointmentReport);
router.get("/revenue", protect, authorize("admin"), revenueReport);
router.get("/doctor-performance", protect, authorize("admin"), doctorPerformance);
router.get("/beds", protect, authorize("admin", "receptionist"), bedOccupancy);

module.exports = router;
