const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  createStaff,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/create-staff", protect, authorize("admin"), createStaff);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
