const express = require("express");
const router = express.Router();
const {
  createBill,
  getBills,
  getBill,
  markPaid,
  markRefunded,
  deleteBill,
} = require("../controllers/billController");
const { protect, authorize } = require("../middleware/auth");

router.post("/", protect, authorize("admin", "receptionist"), createBill);
router.get("/", protect, getBills);
router.get("/:id", protect, getBill);
router.put("/:id/pay", protect, authorize("admin", "receptionist"), markPaid);
router.put("/:id/refund", protect, authorize("admin"), markRefunded);
router.delete("/:id", protect, authorize("admin"), deleteBill);

module.exports = router;
