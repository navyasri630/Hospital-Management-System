const { Bed, Admission, User } = require("../models");
const { logAction } = require("../utils/auditLog");

// GET /api/beds?status=&ward=
exports.getBeds = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.ward) where.ward = req.query.ward;
    const beds = await Bed.findAll({ where, order: [["ward", "ASC"], ["bedNumber", "ASC"]] });
    res.json(beds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/beds (admin only)
exports.createBed = async (req, res) => {
  try {
    const { bedNumber, ward, roomType } = req.body;
    if (!bedNumber || !ward) {
      return res.status(400).json({ message: "bedNumber and ward are required" });
    }
    const existing = await Bed.findOne({ where: { bedNumber } });
    if (existing) return res.status(400).json({ message: "A bed with this number already exists" });

    const bed = await Bed.create({ bedNumber, ward, roomType });
    await logAction(req.user, "added bed", "Bed", bed.id, `${ward} / ${bedNumber}`);
    res.status(201).json(bed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/beds/:id (admin only) - edit details or set to maintenance
exports.updateBed = async (req, res) => {
  try {
    const bed = await Bed.findByPk(req.params.id);
    if (!bed) return res.status(404).json({ message: "Bed not found" });

    const allowed = ["bedNumber", "ward", "roomType"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) bed[field] = req.body[field];
    });
    // Only allow manually toggling into/out of maintenance - occupied is
    // controlled by admission create/discharge.
    if (req.body.status && ["available", "maintenance"].includes(req.body.status) && bed.status !== "occupied") {
      bed.status = req.body.status;
    }
    await bed.save();
    await logAction(req.user, "updated bed", "Bed", bed.id, `${bed.ward} / ${bed.bedNumber}`);
    res.json(bed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/beds/:id (admin only)
exports.deleteBed = async (req, res) => {
  try {
    const bed = await Bed.findByPk(req.params.id);
    if (!bed) return res.status(404).json({ message: "Bed not found" });
    if (bed.status === "occupied") {
      return res.status(400).json({ message: "Cannot remove a bed that is currently occupied" });
    }
    await bed.destroy();
    res.json({ message: "Bed removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
