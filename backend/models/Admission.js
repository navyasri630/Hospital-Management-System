const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

// OPD (outpatient) visits and IPD (inpatient) admissions in one table,
// distinguished by `visitType`. IPD records use ward/bed/discharge fields.
class Admission extends Model {}

Admission.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    visitType: { type: DataTypes.ENUM("opd", "ipd"), allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    ward: { type: DataTypes.STRING, defaultValue: "" }, // IPD only - free text, or derived from linked Bed
    bedNumber: { type: DataTypes.STRING, defaultValue: "" }, // IPD only - free text, or derived from linked Bed
    bedId: { type: DataTypes.INTEGER, allowNull: true }, // optional link to Bed inventory
    admissionDate: { type: DataTypes.DATEONLY, allowNull: false },
    dischargeDate: { type: DataTypes.DATEONLY, allowNull: true },
    dischargeSummary: { type: DataTypes.TEXT, defaultValue: "" },
    status: {
      type: DataTypes.ENUM("active", "discharged"),
      defaultValue: "active",
    },
  },
  { sequelize, modelName: "Admission", tableName: "admissions" }
);

module.exports = Admission;
