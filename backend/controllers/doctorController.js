const { Op } = require("sequelize");
const { User } = require("../models");
const { logAction } = require("../utils/auditLog");

// GET /api/doctors?search=&department=  (any logged-in user)
exports.getDoctors = async (req, res) => {
  try {
    const { search, department } = req.query;
    const where = { role: "doctor" };
    if (department) where.department = department;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { specialization: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    const doctors = await User.findAll({
      where,
      attributes: { exclude: ["password", "resetToken", "resetTokenExpiry"] },
      order: [["createdAt", "DESC"]],
    });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctors/:id
exports.getDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({
      where: { id: req.params.id, role: "doctor" },
      attributes: { exclude: ["password", "resetToken", "resetTokenExpiry"] },
    });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/doctors/:id (admin, receptionist, or the doctor themself)
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({ where: { id: req.params.id, role: "doctor" } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const isSelf = String(req.user.id) === String(doctor.id);
    if (req.user.role === "doctor" && !isSelf) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (req.user.role === "patient") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowed = ["name", "phone", "specialization", "department", "workingHours", "availabilityStatus"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) doctor[field] = req.body[field];
    });
    if (["admin", "receptionist"].includes(req.user.role) && req.body.isActive !== undefined) {
      doctor.isActive = req.body.isActive;
    }
    await doctor.save();
    await logAction(req.user, "updated doctor", "User", doctor.id, doctor.name);
    res.json(doctor.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/doctors/:id (admin only)
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({ where: { id: req.params.id, role: "doctor" } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    await logAction(req.user, "deleted doctor", "User", doctor.id, doctor.name);
    await doctor.destroy();
    res.json({ message: "Doctor removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
