const { Op } = require("sequelize");
const { Appointment, User } = require("../models");
const { logAction } = require("../utils/auditLog");

const withPeople = [
  { model: User, as: "patient", attributes: ["id", "name", "email", "phone"] },
  { model: User, as: "doctor", attributes: ["id", "name", "email", "specialization", "department"] },
];

// POST /api/appointments (patient books, or admin/receptionist books on behalf of a patient)
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, date, timeSlot, reason } = req.body;
    if (!doctorId || !date || !timeSlot || !reason) {
      return res.status(400).json({ message: "doctorId, date, timeSlot and reason are required" });
    }

    const doctor = await User.findOne({ where: { id: doctorId, role: "doctor" } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    let patientIdToUse;
    if (req.user.role === "patient") {
      patientIdToUse = req.user.id;
    } else if (["admin", "receptionist"].includes(req.user.role) && patientId) {
      const p = await User.findOne({ where: { id: patientId, role: "patient" } });
      if (!p) return res.status(404).json({ message: "Patient not found" });
      patientIdToUse = p.id;
    } else {
      return res.status(400).json({ message: "patientId is required" });
    }

    const clash = await Appointment.findOne({
      where: { doctorId, date, timeSlot, status: { [Op.in]: ["pending", "confirmed"] } },
    });
    if (clash) {
      return res.status(409).json({ message: "This time slot is already booked for the selected doctor" });
    }

    const appointment = await Appointment.create({ patientId: patientIdToUse, doctorId, date, timeSlot, reason });
    const populated = await Appointment.findByPk(appointment.id, { include: withPeople });
    await logAction(req.user, "booked appointment", "Appointment", appointment.id, `with Dr. ${doctor.name}`);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments?status=  (scoped by role)
exports.getAppointments = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === "patient") where.patientId = req.user.id;
    if (req.user.role === "doctor") where.doctorId = req.user.id;
    // admin & receptionist see all
    if (req.query.status) where.status = req.query.status;

    const appointments = await Appointment.findAll({
      where,
      include: withPeople,
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments/:id
exports.getAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findByPk(req.params.id, { include: withPeople });
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    const isOwner =
      (req.user.role === "patient" && String(appt.patient.id) === String(req.user.id)) ||
      (req.user.role === "doctor" && String(appt.doctor.id) === String(req.user.id));
    if (!["admin", "receptionist"].includes(req.user.role) && !isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/appointments/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes, prescription, diagnosis } = req.body;
    const appt = await Appointment.findByPk(req.params.id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    const isOwnerDoctor = req.user.role === "doctor" && String(appt.doctorId) === String(req.user.id);
    const isOwnerPatient = req.user.role === "patient" && String(appt.patientId) === String(req.user.id);

    if (req.user.role === "patient") {
      if (!isOwnerPatient || status !== "cancelled") {
        return res.status(403).json({ message: "Patients may only cancel their own appointments" });
      }
    } else if (req.user.role === "doctor" && !isOwnerDoctor) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (status) appt.status = status;
    if (notes !== undefined) appt.notes = notes;
    if (prescription !== undefined) appt.prescription = prescription;
    if (diagnosis !== undefined) appt.diagnosis = diagnosis;
    await appt.save();

    const populated = await Appointment.findByPk(appt.id, { include: withPeople });
    await logAction(req.user, `set appointment status to ${appt.status}`, "Appointment", appt.id);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/appointments/:id/reschedule  (patient self, admin, or receptionist)
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    if (!date || !timeSlot) return res.status(400).json({ message: "date and timeSlot are required" });

    const appt = await Appointment.findByPk(req.params.id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    const isOwnerPatient = req.user.role === "patient" && String(appt.patientId) === String(req.user.id);
    if (req.user.role === "patient" && !isOwnerPatient) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (req.user.role === "doctor") {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!["pending", "confirmed"].includes(appt.status)) {
      return res.status(400).json({ message: "Only pending or confirmed appointments can be rescheduled" });
    }

    const clash = await Appointment.findOne({
      where: {
        doctorId: appt.doctorId,
        date,
        timeSlot,
        status: { [Op.in]: ["pending", "confirmed"] },
        id: { [Op.ne]: appt.id },
      },
    });
    if (clash) {
      return res.status(409).json({ message: "This time slot is already booked for the selected doctor" });
    }

    appt.date = date;
    appt.timeSlot = timeSlot;
    appt.status = "pending"; // needs re-confirmation after reschedule
    await appt.save();

    const populated = await Appointment.findByPk(appt.id, { include: withPeople });
    await logAction(req.user, "rescheduled appointment", "Appointment", appt.id, `${date} ${timeSlot}`);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/appointments/:id (admin only)
exports.deleteAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findByPk(req.params.id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    await logAction(req.user, "deleted appointment", "Appointment", appt.id);
    await appt.destroy();
    res.json({ message: "Appointment removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
