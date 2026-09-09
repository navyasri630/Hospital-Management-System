const User = require("./User");
const Appointment = require("./Appointment");
const Document = require("./Document");
const Admission = require("./Admission");
const AuditLog = require("./AuditLog");
const Bed = require("./Bed");
const Bill = require("./Bill");

// A patient (User) can have many appointments as the patient
User.hasMany(Appointment, { foreignKey: "patientId", as: "appointmentsAsPatient" });
Appointment.belongsTo(User, { foreignKey: "patientId", as: "patient" });

// A doctor (User) can have many appointments as the doctor
User.hasMany(Appointment, { foreignKey: "doctorId", as: "appointmentsAsDoctor" });
Appointment.belongsTo(User, { foreignKey: "doctorId", as: "doctor" });

// Documents belong to a patient, optionally uploaded by a specific user
User.hasMany(Document, { foreignKey: "patientId", as: "documents" });
Document.belongsTo(User, { foreignKey: "patientId", as: "patient" });
Document.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });

// Admissions (OPD/IPD) belong to a patient and a doctor, and IPD ones
// optionally occupy a real bed from the inventory
User.hasMany(Admission, { foreignKey: "patientId", as: "admissionsAsPatient" });
Admission.belongsTo(User, { foreignKey: "patientId", as: "patient" });
User.hasMany(Admission, { foreignKey: "doctorId", as: "admissionsAsDoctor" });
Admission.belongsTo(User, { foreignKey: "doctorId", as: "doctor" });
Bed.hasOne(Admission, { foreignKey: "bedId", as: "currentAdmission" });
Admission.belongsTo(Bed, { foreignKey: "bedId", as: "bed" });

// Bills belong to a patient, and optionally reference the appointment or
// admission they were generated from
User.hasMany(Bill, { foreignKey: "patientId", as: "bills" });
Bill.belongsTo(User, { foreignKey: "patientId", as: "patient" });
Bill.belongsTo(User, { foreignKey: "issuedById", as: "issuedBy" });
Bill.belongsTo(Appointment, { foreignKey: "appointmentId", as: "appointment" });
Bill.belongsTo(Admission, { foreignKey: "admissionId", as: "admission" });

module.exports = { User, Appointment, Document, Admission, AuditLog, Bed, Bill };
