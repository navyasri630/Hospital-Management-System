const { Sequelize } = require("sequelize");
const path = require("path");

// SQLite stores everything in a single local file - no separate database
// server/service required. The file is created automatically on first run.
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "..", "data", "hospital.sqlite"),
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("SQLite database connected (file: data/hospital.sqlite)");
  } catch (err) {
    console.error(`Database connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
