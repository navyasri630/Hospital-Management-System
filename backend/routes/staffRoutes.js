const express = require("express");
const router = express.Router();
const { getStaff, toggleActive, deleteStaff } = require("../controllers/staffController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, authorize("admin"), getStaff);
router.put("/:id/toggle-active", protect, authorize("admin"), toggleActive);
router.delete("/:id", protect, authorize("admin"), deleteStaff);

module.exports = router;
