const { Op, fn, col } = require("sequelize");
const { User, Appointment, Bill, Admission } = require("../models");

// GET /api/reports/patients  (admin, receptionist)
exports.patientStatistics = async (req, res) => {
  try {
    const [total, active, inactive, byGender] = await Promise.all([
      User.count({ where: { role: "patient" } }),
      User.count({ where: { role: "patient", isActive: true } }),
      User.count({ where: { role: "patient", isActive: false } }),
      User.findAll({
        where: { role: "patient" },
        attributes: ["gender", [fn("COUNT", col("id")), "count"]],
        group: ["gender"],
        raw: true,
      }),
    ]);
    res.json({ total, active, inactive, byGender });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/appointments?from=&to=  (admin, receptionist)
exports.appointmentReport = async (req, res) => {
  try {
    const where = {};
    if (req.query.from || req.query.to) {
      where.date = {};
      if (req.query.from) where.date[Op.gte] = req.query.from;
      if (req.query.to) where.date[Op.lte] = req.query.to;
    }
    const [byStatus, byDoctor, total] = await Promise.all([
      Appointment.findAll({
        where,
        attributes: ["status", [fn("COUNT", col("Appointment.id")), "count"]],
        group: ["status"],
        raw: true,
      }),
      Appointment.findAll({
        where,
        include: [{ model: User, as: "doctor", attributes: ["name", "specialization"] }],
        attributes: ["doctorId", [fn("COUNT", col("Appointment.id")), "count"]],
        group: ["doctorId"],
        raw: true,
      }),
      Appointment.count({ where }),
    ]);
    res.json({ total, byStatus, byDoctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/revenue?from=&to=  (admin only)
exports.revenueReport = async (req, res) => {
  try {
    const where = {};
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt[Op.gte] = new Date(req.query.from);
      if (req.query.to) where.createdAt[Op.lte] = new Date(req.query.to);
    }
    const bills = await Bill.findAll({ where, raw: true });
    const totalBilled = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalPaid = bills.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.totalAmount, 0);
    const totalOutstanding = bills.filter((b) => b.status === "unpaid").reduce((sum, b) => sum + b.totalAmount, 0);
    const totalRefunded = bills.filter((b) => b.status === "refunded").reduce((sum, b) => sum + b.totalAmount, 0);

    res.json({
      billCount: bills.length,
      totalBilled,
      totalPaid,
      totalOutstanding,
      totalRefunded,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/doctor-performance  (admin only)
exports.doctorPerformance = async (req, res) => {
  try {
    const doctors = await User.findAll({ where: { role: "doctor" }, attributes: ["id", "name", "specialization"] });
    const results = await Promise.all(
      doctors.map(async (doc) => {
        const [total, completed, cancelled] = await Promise.all([
          Appointment.count({ where: { doctorId: doc.id } }),
          Appointment.count({ where: { doctorId: doc.id, status: "completed" } }),
          Appointment.count({ where: { doctorId: doc.id, status: "cancelled" } }),
        ]);
        return {
          doctorId: doc.id,
          name: doc.name,
          specialization: doc.specialization,
          totalAppointments: total,
          completed,
          cancelled,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/beds  (admin, receptionist) - occupancy snapshot
exports.bedOccupancy = async (req, res) => {
  try {
    const { Bed } = require("../models");
    const [total, occupied, available, maintenance] = await Promise.all([
      Bed.count(),
      Bed.count({ where: { status: "occupied" } }),
      Bed.count({ where: { status: "available" } }),
      Bed.count({ where: { status: "maintenance" } }),
    ]);
    res.json({
      total,
      occupied,
      available,
      maintenance,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
