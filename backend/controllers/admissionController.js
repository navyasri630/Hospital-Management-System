const { Admission, User, Bed } = require("../models");
const { logAction } = require("../utils/auditLog");

const withPeople = [
  { model: User, as: "patient", attributes: ["id", "name", "email", "phone"] },
  { model: User, as: "doctor", attributes: ["id", "name", "specialization", "department"] },
  { model: Bed, as: "bed" },
];

// POST /api/admissions  (admin, receptionist, doctor)
exports.createAdmission = async (req, res) => {
  try {
    const { patientId, doctorId, visitType, reason, ward, bedNumber, bedId, admissionDate } = req.body;
    if (!patientId || !visitType || !reason || !admissionDate) {
      return res.status(400).json({ message: "patientId, visitType, reason and admissionDate are required" });
    }
    const patient = await User.findOne({ where: { id: patientId, role: "patient" } });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (doctorId) {
      const doctor = await User.findOne({ where: { id: doctorId, role: "doctor" } });
      if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    }

    let finalWard = visitType === "ipd" ? ward : "";
    let finalBedNumber = visitType === "ipd" ? bedNumber : "";
    let bed = null;

    if (visitType === "ipd" && bedId) {
      bed = await Bed.findByPk(bedId);
      if (!bed) return res.status(404).json({ message: "Bed not found" });
      if (bed.status !== "available") {
        return res.status(409).json({ message: "This bed is not available" });
      }
      finalWard = bed.ward;
      finalBedNumber = bed.bedNumber;
    }

    const admission = await Admission.create({
      patientId,
      doctorId: doctorId || null,
      visitType,
      reason,
      ward: finalWard,
      bedNumber: finalBedNumber,
      bedId: bed ? bed.id : null,
      admissionDate,
    });

    if (bed) {
      bed.status = "occupied";
      await bed.save();
    }

    const populated = await Admission.findByPk(admission.id, { include: withPeople });
    await logAction(req.user, `registered ${visitType.toUpperCase()} visit`, "Admission", admission.id, patient.name);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admissions?visitType=&status=
exports.getAdmissions = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === "patient") where.patientId = req.user.id;
    if (req.user.role === "doctor") where.doctorId = req.user.id;
    if (req.query.visitType) where.visitType = req.query.visitType;
    if (req.query.status) where.status = req.query.status;

    const admissions = await Admission.findAll({
      where,
      include: withPeople,
      order: [["admissionDate", "DESC"]],
    });
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admissions/:id
exports.getAdmission = async (req, res) => {
  try {
    const admission = await Admission.findByPk(req.params.id, { include: withPeople });
    if (!admission) return res.status(404).json({ message: "Record not found" });

    const isOwner =
      (req.user.role === "patient" && String(admission.patientId) === String(req.user.id)) ||
      (req.user.role === "doctor" && String(admission.doctorId) === String(req.user.id));
    if (!["admin", "receptionist"].includes(req.user.role) && !isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(admission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admissions/:id  (update ward/bed, or discharge)
exports.updateAdmission = async (req, res) => {
  try {
    const admission = await Admission.findByPk(req.params.id);
    if (!admission) return res.status(404).json({ message: "Record not found" });
    if (req.user.role === "patient") return res.status(403).json({ message: "Forbidden" });

    const { ward, bedNumber, dischargeDate, dischargeSummary, status } = req.body;
    if (ward !== undefined) admission.ward = ward;
    if (bedNumber !== undefined) admission.bedNumber = bedNumber;
    if (dischargeDate !== undefined) admission.dischargeDate = dischargeDate;
    if (dischargeSummary !== undefined) admission.dischargeSummary = dischargeSummary;

    // Discharging releases the linked bed back to "available"
    if (status === "discharged" && admission.status !== "discharged") {
      admission.status = "discharged";
      if (admission.bedId) {
        const bed = await Bed.findByPk(admission.bedId);
        if (bed && bed.status === "occupied") {
          bed.status = "available";
          await bed.save();
        }
      }
    } else if (status !== undefined) {
      admission.status = status;
    }

    await admission.save();

    const populated = await Admission.findByPk(admission.id, { include: withPeople });
    await logAction(req.user, "updated admission record", "Admission", admission.id);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admissions/:id (admin only)
exports.deleteAdmission = async (req, res) => {
  try {
    const admission = await Admission.findByPk(req.params.id);
    if (!admission) return res.status(404).json({ message: "Record not found" });

    if (admission.bedId && admission.status === "active") {
      const bed = await Bed.findByPk(admission.bedId);
      if (bed && bed.status === "occupied") {
        bed.status = "available";
        await bed.save();
      }
    }

    await admission.destroy();
    res.json({ message: "Record removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
