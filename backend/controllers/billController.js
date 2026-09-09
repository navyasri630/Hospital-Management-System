const { Bill, User, Appointment, Admission } = require("../models");
const { logAction } = require("../utils/auditLog");

const withPeople = [
  { model: User, as: "patient", attributes: ["id", "name", "email", "phone"] },
  { model: User, as: "issuedBy", attributes: ["id", "name", "role"] },
  { model: Appointment, as: "appointment", attributes: ["id", "date", "reason"] },
  { model: Admission, as: "admission", attributes: ["id", "visitType", "admissionDate"] },
];

// POST /api/bills  (admin, receptionist)
exports.createBill = async (req, res) => {
  try {
    const { patientId, appointmentId, admissionId, items, paymentMethod, insuranceProvider, notes } = req.body;
    if (!patientId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "patientId and at least one line item are required" });
    }

    const patient = await User.findOne({ where: { id: patientId, role: "patient" } });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const cleanItems = items
      .filter((i) => i.description && !isNaN(parseFloat(i.amount)))
      .map((i) => ({ description: String(i.description), amount: parseFloat(i.amount) }));
    if (cleanItems.length === 0) {
      return res.status(400).json({ message: "Every line item needs a description and a numeric amount" });
    }
    const totalAmount = cleanItems.reduce((sum, i) => sum + i.amount, 0);

    const bill = await Bill.create({
      patientId,
      issuedById: req.user.id,
      appointmentId: appointmentId || null,
      admissionId: admissionId || null,
      items: JSON.stringify(cleanItems),
      totalAmount,
      paymentMethod: paymentMethod || "",
      insuranceProvider: insuranceProvider || "",
      notes: notes || "",
    });

    const populated = await Bill.findByPk(bill.id, { include: withPeople });
    await logAction(req.user, "generated bill", "Bill", bill.id, `${patient.name} - $${totalAmount.toFixed(2)}`);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bills?status=  (scoped by role)
exports.getBills = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === "patient") where.patientId = req.user.id;
    if (req.query.status) where.status = req.query.status;

    const bills = await Bill.findAll({
      where,
      include: withPeople,
      order: [["createdAt", "DESC"]],
    });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bills/:id
exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id, { include: withPeople });
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    if (req.user.role === "patient" && String(bill.patientId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/bills/:id/pay  (admin, receptionist - record payment collected)
exports.markPaid = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    const { paymentMethod } = req.body;
    bill.status = "paid";
    bill.paidAt = new Date();
    if (paymentMethod) bill.paymentMethod = paymentMethod;
    await bill.save();

    const populated = await Bill.findByPk(bill.id, { include: withPeople });
    await logAction(req.user, "recorded payment", "Bill", bill.id, `$${bill.totalAmount.toFixed(2)}`);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/bills/:id/refund  (admin only)
exports.markRefunded = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    bill.status = "refunded";
    await bill.save();
    await logAction(req.user, "refunded bill", "Bill", bill.id, `$${bill.totalAmount.toFixed(2)}`);
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/bills/:id (admin only)
exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    await bill.destroy();
    res.json({ message: "Bill removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
