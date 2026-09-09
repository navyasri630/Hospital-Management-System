const { Op } = require("sequelize");
const { User, Document } = require("../models");
const { logAction } = require("../utils/auditLog");

// GET /api/patients?search=  (admin, doctor, receptionist)
exports.getPatients = async (req, res) => {
  try {
    const { search } = req.query;
    const where = { role: "patient" };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }
    const patients = await User.findAll({
      where,
      attributes: { exclude: ["password", "resetToken", "resetTokenExpiry"] },
      order: [["createdAt", "DESC"]],
    });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/patients/:id (admin, doctor, receptionist, or the patient themself)
exports.getPatient = async (req, res) => {
  try {
    const patient = await User.findOne({
      where: { id: req.params.id, role: "patient" },
      attributes: { exclude: ["password", "resetToken", "resetTokenExpiry"] },
      include: [{ model: Document, as: "documents" }],
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (req.user.role === "patient" && String(req.user.id) !== String(patient.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/patients/:id  (admin, receptionist, or the patient themself)
exports.updatePatient = async (req, res) => {
  try {
    const patient = await User.findOne({ where: { id: req.params.id, role: "patient" } });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const isSelf = String(req.user.id) === String(patient.id);
    if (req.user.role === "patient" && !isSelf) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (req.user.role === "doctor") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowed = [
      "name",
      "phone",
      "dateOfBirth",
      "gender",
      "address",
      "emergencyContactName",
      "emergencyContactPhone",
      "allergies",
      "vaccinationHistory",
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) patient[field] = req.body[field];
    });
    if (["admin", "receptionist"].includes(req.user.role) && req.body.isActive !== undefined) {
      patient.isActive = req.body.isActive;
    }
    await patient.save();
    await logAction(req.user, "updated patient", "User", patient.id, patient.name);
    res.json(patient.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/patients (admin, receptionist - register a walk-in patient)
exports.createPatient = async (req, res) => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, address, emergencyContactName, emergencyContactPhone } =
      req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }
    const patient = await User.create({
      name,
      email,
      password,
      phone,
      dateOfBirth: dateOfBirth || null,
      gender,
      address,
      emergencyContactName,
      emergencyContactPhone,
      role: "patient",
    });
    await logAction(req.user, "registered walk-in patient", "User", patient.id, name);
    res.status(201).json(patient.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/patients/:id (admin only)
exports.deletePatient = async (req, res) => {
  try {
    const patient = await User.findOne({ where: { id: req.params.id, role: "patient" } });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    await logAction(req.user, "deleted patient", "User", patient.id, patient.name);
    await patient.destroy();
    res.json({ message: "Patient removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/patients/:id/documents (upload a medical document/report/photo)
exports.uploadDocument = async (req, res) => {
  try {
    const patient = await User.findOne({ where: { id: req.params.id, role: "patient" } });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (req.user.role === "patient" && String(req.user.id) !== String(patient.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const doc = await Document.create({
      patientId: patient.id,
      uploadedById: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      category: req.body.category || "other",
    });
    await logAction(req.user, "uploaded document", "Document", doc.id, req.file.originalname);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/patients/:id/documents
exports.getDocuments = async (req, res) => {
  try {
    const patient = await User.findOne({ where: { id: req.params.id, role: "patient" } });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (req.user.role === "patient" && String(req.user.id) !== String(patient.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const docs = await Document.findAll({ where: { patientId: patient.id }, order: [["createdAt", "DESC"]] });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/patients/:id/documents/:docId
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ where: { id: req.params.docId, patientId: req.params.id } });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (req.user.role === "patient" && String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await doc.destroy();
    res.json({ message: "Document removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
