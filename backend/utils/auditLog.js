const { AuditLog } = require("../models");

// Fire-and-forget audit trail write. Never throws - a logging failure
// should never break the actual request.
const logAction = async (user, action, targetType = "", targetId = "", details = "") => {
  try {
    await AuditLog.create({
      actorName: user?.name || "System",
      actorRole: user?.role || "system",
      action,
      targetType,
      targetId: String(targetId || ""),
      details,
    });
  } catch (err) {
    console.error("Audit log write failed:", err.message);
  }
};

module.exports = { logAction };
