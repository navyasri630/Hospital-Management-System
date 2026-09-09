const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

// A lightweight trail of who did what. Written by the auditLog middleware
// on create/update/delete actions against sensitive resources.
class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    actorName: { type: DataTypes.STRING, allowNull: false },
    actorRole: { type: DataTypes.STRING, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false }, // e.g. "created appointment"
    targetType: { type: DataTypes.STRING, defaultValue: "" }, // e.g. "Appointment"
    targetId: { type: DataTypes.STRING, defaultValue: "" },
    details: { type: DataTypes.TEXT, defaultValue: "" },
  },
  { sequelize, modelName: "AuditLog", tableName: "audit_logs" }
);

module.exports = AuditLog;
