const express = require("express");
const router = express.Router();
const { getBeds, createBed, updateBed, deleteBed } = require("../controllers/bedController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, authorize("admin", "receptionist", "doctor"), getBeds);
router.post("/", protect, authorize("admin"), createBed);
router.put("/:id", protect, authorize("admin"), updateBed);
router.delete("/:id", protect, authorize("admin"), deleteBed);

module.exports = router;
