const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

// Line items are stored as a JSON string: [{ description, amount }, ...]
// No live payment gateway is wired up - "paid" is set manually by
// admin/receptionist once payment is collected at the desk. This keeps
// the data model ready to plug a real gateway (Stripe/Razorpay) in later
// without changing anything else.
class Bill extends Model {
  getItems() {
    try {
      return JSON.parse(this.items || "[]");
    } catch {
      return [];
    }
  }
}

Bill.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    items: { type: DataTypes.TEXT, allowNull: false, defaultValue: "[]" },
    totalAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM("unpaid", "paid", "refunded"),
      defaultValue: "unpaid",
    },
    paymentMethod: { type: DataTypes.STRING, defaultValue: "" }, // cash, card, insurance, etc.
    insuranceProvider: { type: DataTypes.STRING, defaultValue: "" },
    notes: { type: DataTypes.TEXT, defaultValue: "" },
    paidAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: "Bill", tableName: "bills" }
);

module.exports = Bill;
