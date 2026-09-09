const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

// A real inventory of physical beds, separate from free-text ward/bed
// fields. Admins manage this list; IPD admissions pick from beds that
// are currently "available", which then flips to "occupied" until the
// patient is discharged.
class Bed extends Model {}

Bed.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bedNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    ward: { type: DataTypes.STRING, allowNull: false },
    roomType: {
      type: DataTypes.ENUM("general", "semi-private", "private", "icu"),
      defaultValue: "general",
    },
    status: {
      type: DataTypes.ENUM("available", "occupied", "maintenance"),
      defaultValue: "available",
    },
  },
  { sequelize, modelName: "Bed", tableName: "beds" }
);

module.exports = Bed;
