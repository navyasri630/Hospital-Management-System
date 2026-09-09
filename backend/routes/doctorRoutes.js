const express = require("express");
const router = express.Router();
const {
  getDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, getDoctors);
router.get("/:id", protect, getDoctor);
router.put("/:id", protect, updateDoctor);
router.delete("/:id", protect, authorize("admin"), deleteDoctor);

module.exports = router;
