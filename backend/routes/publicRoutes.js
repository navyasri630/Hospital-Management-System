const express = require("express");
const router = express.Router();

// This codebase stores each doctor's department as a plain text column
// (User.department) rather than a separate Department table, so there's
// nothing in the database to query here. This is a small curated list
// matching the departments used in seed.js, exposed publicly (no auth) so
// the sign-up page can populate its department dropdown before login.
const DEPARTMENTS = [
  "Cardiology", "Pediatrics", "Dermatology", "Orthopedics", "Neurology",
  "General Medicine", "Gynecology", "ENT", "Dental", "Emergency",
].map((name) => ({ id: name, name }));

router.get("/departments", (req, res) => {
  res.json({ data: DEPARTMENTS });
});

module.exports = router;
