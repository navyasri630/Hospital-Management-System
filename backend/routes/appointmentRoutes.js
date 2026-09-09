const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  getAppointment,
  updateStatus,
  rescheduleAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/auth");

router.post("/", protect, authorize("patient", "admin", "receptionist"), createAppointment);
router.get("/", protect, getAppointments);
router.get("/:id", protect, getAppointment);
router.put("/:id/status", protect, updateStatus);
router.put("/:id/reschedule", protect, rescheduleAppointment);
router.delete("/:id", protect, authorize("admin"), deleteAppointment);

module.exports = router;
