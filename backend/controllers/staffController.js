const { Op } = require("sequelize");
const { User } = require("../models");
const { logAction } = require("../utils/auditLog");

// GET /api/staff?search=&role=  (admin only)
exports.getStaff = async (req, res) => {
  try {
    const { search, role } = req.query;
    const where = {};
    where.role = role && ["doctor", "receptionist", "admin"].includes(role)
      ? role
      : { [Op.in]: ["doctor", "receptionist", "admin"] };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    const staff = await User.findAll({
      where,
      attributes: { exclude: ["password", "resetToken", "resetTokenExpiry"] },
      order: [["role", "ASC"], ["name", "ASC"]],
    });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/staff/:id/toggle-active  (admin only) - deactivate/reactivate any staff account
exports.toggleActive = async (req, res) => {
  try {
    const member = await User.findOne({
      where: { id: req.params.id, role: { [Op.in]: ["doctor", "receptionist", "admin"] } },
    });
    if (!member) return res.status(404).json({ message: "Staff member not found" });
    if (String(member.id) === String(req.user.id)) {
      return res.status(400).json({ message: "You can't deactivate your own account" });
    }
    member.isActive = !member.isActive;
    await member.save();
    await logAction(
      req.user,
      member.isActive ? "reactivated staff account" : "deactivated staff account",
      "User",
      member.id,
      member.name
    );
    res.json(member.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/staff/:id  (admin only)
exports.deleteStaff = async (req, res) => {
  try {
    const member = await User.findOne({
      where: { id: req.params.id, role: { [Op.in]: ["doctor", "receptionist", "admin"] } },
    });
    if (!member) return res.status(404).json({ message: "Staff member not found" });
    if (String(member.id) === String(req.user.id)) {
      return res.status(400).json({ message: "You can't remove your own account" });
    }
    await logAction(req.user, "removed staff account", "User", member.id, member.name);
    await member.destroy();
    res.json({ message: "Staff member removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
