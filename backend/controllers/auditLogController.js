const { AuditLog } = require("../models");

// GET /api/audit-logs  (admin only)
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      order: [["createdAt", "DESC"]],
      limit: 300,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
