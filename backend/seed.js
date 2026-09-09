// Run with: npm run seed
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { sequelize, connectDB } = require("./config/db");
const { User, Bed } = require("./models");

const run = async () => {
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

  await connectDB();
  await sequelize.sync();

  const admin = await User.findOne({ where: { email: "admin@hospital.com" } });
  if (!admin) {
    await User.create({ name: "System Admin", email: "admin@hospital.com", password: "Admin@123", role: "admin" });
    console.log("Created admin -> email: admin@hospital.com | password: Admin@123");
  } else {
    console.log("Admin already exists, skipping.");
  }

  const receptionist = await User.findOne({ where: { email: "reception@hospital.com" } });
  if (!receptionist) {
    await User.create({
      name: "Front Desk",
      email: "reception@hospital.com",
      password: "Reception@123",
      role: "receptionist",
    });
    console.log("Created receptionist -> email: reception@hospital.com | password: Reception@123");
  }

  const doctors = [
    { name: "Dr. Sarah Mitchell", email: "sarah.mitchell@hospital.com", specialization: "Cardiology", department: "Cardiology", workingHours: "Mon-Fri 9:00 AM - 5:00 PM" },
    { name: "Dr. James Okafor", email: "james.okafor@hospital.com", specialization: "Pediatrics", department: "Pediatrics", workingHours: "Mon-Sat 10:00 AM - 4:00 PM" },
    { name: "Dr. Priya Nair", email: "priya.nair@hospital.com", specialization: "Dermatology", department: "Dermatology", workingHours: "Tue-Sat 11:00 AM - 6:00 PM" },
  ];

  for (const doc of doctors) {
    const exists = await User.findOne({ where: { email: doc.email } });
    if (!exists) {
      await User.create({ ...doc, password: "Doctor@123", role: "doctor" });
      console.log(`Created doctor -> email: ${doc.email} | password: Doctor@123`);
    }
  }

  const beds = [
    { bedNumber: "A-101", ward: "General Ward A", roomType: "general" },
    { bedNumber: "A-102", ward: "General Ward A", roomType: "general" },
    { bedNumber: "B-201", ward: "General Ward B", roomType: "semi-private" },
    { bedNumber: "B-202", ward: "General Ward B", roomType: "semi-private" },
    { bedNumber: "P-301", ward: "Private Wing", roomType: "private" },
    { bedNumber: "ICU-01", ward: "Intensive Care Unit", roomType: "icu" },
    { bedNumber: "ICU-02", ward: "Intensive Care Unit", roomType: "icu" },
  ];

  for (const bed of beds) {
    const exists = await Bed.findOne({ where: { bedNumber: bed.bedNumber } });
    if (!exists) {
      await Bed.create(bed);
      console.log(`Created bed -> ${bed.ward} / ${bed.bedNumber}`);
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
