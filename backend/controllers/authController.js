const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models");
const { logAction } = require("../utils/auditLog");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// @route POST /api/auth/register
// NOTE: this app intentionally lets anyone pick their role at sign-up
// (including admin/doctor/receptionist) via the sign-up page's role picker,
// for demo/local-development purposes. In a real deployment you would
// restrict privileged roles to invite-only or admin-created accounts (see
// createStaff below for the more typical admin-gated flow).
const VALID_ROLES = ["admin", "doctor", "patient", "receptionist", "nurse", "pharmacist", "lab_technician", "admin_clerk", "housekeeping"];

exports.register = async (req, res) => {
  try {
    const {
      name, email, password, phone, dateOfBirth, gender, address, role,
      // doctor-specific fields from the sign-up form
      specialization, departmentId, workingHours,
    } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }
    const assignedRole = VALID_ROLES.includes(role) ? role : "patient";
    if (assignedRole === "doctor" && !specialization) {
      return res.status(400).json({ message: "Specialization is required to register as a doctor" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      dateOfBirth: dateOfBirth || null,
      gender,
      address,
      role: assignedRole,
      // departmentId from the sign-up form's department picker is actually
      // the department's display name (see publicController.listDepartments),
      // which maps directly onto this flat `department` string column.
      specialization: specialization || "",
      department: departmentId || "",
      workingHours: workingHours || "",
    });
    await logAction(user, "registered", "User", user.id);
    res.status(201).json({ user: user.toSafeObject(), token: generateToken(user.id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/create-staff  (admin only) - doctor, admin, or receptionist
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role, phone, specialization, department, workingHours } = req.body;
    if (!["doctor", "admin", "receptionist"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'doctor', 'admin', or 'receptionist'" });
    }
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      specialization,
      department,
      workingHours,
    });
    await logAction(req.user, `created ${role} account`, "User", user.id, name);
    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }
    res.json({ user: user.toSafeObject(), token: generateToken(user.id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

// @route POST /api/auth/forgot-password
// No email service is configured in this project, so the reset link is
// returned directly in the API response and logged to the server console.
// Wire this to a real email provider (SendGrid, etc.) before production use.
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    // Always respond the same way whether or not the user exists, to avoid
    // leaking which emails are registered.
    if (!user) {
      return res.json({
        message: "If an account with that email exists, a reset link has been generated.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${token}`;
    console.log(`\nPassword reset requested for ${user.email}`);
    console.log(`Reset link (would normally be emailed): ${resetUrl}\n`);

    res.json({
      message: "If an account with that email exists, a reset link has been generated.",
      // Exposed directly here ONLY because no email service is wired up yet.
      devResetUrl: resetUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const { Op } = require("sequelize");
    const user = await User.findOne({
      where: { resetToken: hashedToken, resetTokenExpiry: { [Op.gt]: new Date() } },
    });

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired" });
    }

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    await logAction(user, "reset password", "User", user.id);
    res.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
