const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

// Represents an uploaded file: medical document, lab report, prescription
// scan, or profile photo - metadata is stored in the DB, the file itself
// lives on disk under /uploads.
class Document extends Model {}

Document.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fileName: { type: DataTypes.STRING, allowNull: false },
    originalName: { type: DataTypes.STRING, allowNull: false },
    fileUrl: { type: DataTypes.STRING, allowNull: false },
    fileType: { type: DataTypes.STRING, defaultValue: "" }, // mime type
    category: {
      type: DataTypes.ENUM("medical_document", "lab_report", "prescription", "profile_photo", "other"),
      defaultValue: "other",
    },
  },
  { sequelize, modelName: "Document", tableName: "documents" }
);

module.exports = Document;
