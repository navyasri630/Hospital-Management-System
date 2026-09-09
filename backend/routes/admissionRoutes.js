const express = require("express");
const router = express.Router();
const {
  createAdmission,
  getAdmissions,
  getAdmission,
  updateAdmission,
  deleteAdmission,
} = require("../controllers/admissionController");
const { protect, authorize } = require("../middleware/auth");

router.post("/", protect, authorize("admin", "receptionist", "doctor"), createAdmission);
router.get("/", protect, getAdmissions);
router.get("/:id", protect, getAdmission);
router.put("/:id", protect, authorize("admin", "receptionist", "doctor"), updateAdmission);
router.delete("/:id", protect, authorize("admin"), deleteAdmission);

module.exports = router;
