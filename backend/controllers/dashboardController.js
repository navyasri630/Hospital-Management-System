const { Op, fn, col } = require("sequelize");
const { User, Appointment, Admission } = require("../models");

// GET /api/dashboard/stats  (admin, receptionist, doctor - each sees relevant slice)
exports.getStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    if (req.user.role === "patient") {
      const [upcoming, completed] = await Promise.all([
        Appointment.count({ where: { patientId: req.user.id, status: { [Op.in]: ["pending", "confirmed"] } } }),
        Appointment.count({ where: { patientId: req.user.id, status: "completed" } }),
      ]);
      return res.json({ role: "patient", upcomingAppointments: upcoming, completedAppointments: completed });
    }

    if (req.user.role === "doctor") {
      const [today_, pending, completed] = await Promise.all([
        Appointment.count({ where: { doctorId: req.user.id, date: today } }),
        Appointment.count({ where: { doctorId: req.user.id, status: "pending" } }),
        Appointment.count({ where: { doctorId: req.user.id, status: "completed" } }),
      ]);
      return res.json({ role: "doctor", todaysAppointments: today_, pendingRequests: pending, completedVisits: completed });
    }

    // admin / receptionist - hospital-wide overview
    const [totalPatients, totalDoctors, todaysAppointments, activeAdmissions, appointmentsByStatus] = await Promise.all([
      User.count({ where: { role: "patient" } }),
      User.count({ where: { role: "doctor" } }),
      Appointment.count({ where: { date: today } }),
      Admission.count({ where: { status: "active" } }),
      Appointment.findAll({
        attributes: ["status", [fn("COUNT", col("status")), "count"]],
        group: ["status"],
        raw: true,
      }),
    ]);

    // Appointments per day for the last 7 days (for a simple trend chart)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const recent = await Appointment.findAll({
      attributes: ["date", [fn("COUNT", col("id")), "count"]],
      where: { date: { [Op.gte]: sevenDaysAgo.toISOString().split("T")[0] } },
      group: ["date"],
      order: [["date", "ASC"]],
      raw: true,
    });

    res.json({
      role: req.user.role,
      totalPatients,
      totalDoctors,
      todaysAppointments,
      activeAdmissions,
      appointmentsByStatus,
      appointmentsLast7Days: recent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
