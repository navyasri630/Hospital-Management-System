const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

class Appointment extends Model {}

Appointment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    timeSlot: { type: DataTypes.STRING, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "completed", "cancelled"),
      defaultValue: "pending",
    },
    diagnosis: { type: DataTypes.TEXT, defaultValue: "" },
    notes: { type: DataTypes.TEXT, defaultValue: "" },
    prescription: { type: DataTypes.TEXT, defaultValue: "" },
  },
  { sequelize, modelName: "Appointment", tableName: "appointments" }
);

module.exports = Appointment;
