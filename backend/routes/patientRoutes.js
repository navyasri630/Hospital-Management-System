const express = require("express");
const router = express.Router();
const {
  getPatients,
  getPatient,
  updatePatient,
  createPatient,
  deletePatient,
  uploadDocument,
  getDocuments,
  deleteDocument,
} = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/", protect, authorize("admin", "doctor", "receptionist"), getPatients);
router.post("/", protect, authorize("admin", "receptionist"), createPatient);
router.get("/:id", protect, getPatient);
router.put("/:id", protect, updatePatient);
router.delete("/:id", protect, authorize("admin"), deletePatient);

router.get("/:id/documents", protect, getDocuments);
router.post("/:id/documents", protect, upload.single("file"), uploadDocument);
router.delete("/:id/documents/:docId", protect, authorize("admin", "receptionist", "patient"), deleteDocument);

module.exports = router;
