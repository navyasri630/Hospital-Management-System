const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/db");

class User extends Model {
  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  }

  toSafeObject() {
    const obj = this.toJSON();
    delete obj.password;
    delete obj.resetToken;
    delete obj.resetTokenExpiry;
    return obj;
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(value) {
        this.setDataValue("email", value.toLowerCase().trim());
      },
    },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM(
        "admin", "doctor", "patient", "receptionist",
        // Extended roles supported by the sign-up page's role picker. This
        // codebase's Sidebar/Dashboard only have dedicated views for the four
        // roles above; these extra roles can register and log in, but will
        // see a minimal dashboard until dedicated pages are built for them.
        "nurse", "pharmacist", "lab_technician", "admin_clerk", "housekeeping"
      ),
      defaultValue: "patient",
    },
    phone: { type: DataTypes.STRING, defaultValue: "" },

    // Doctor-only fields
    specialization: { type: DataTypes.STRING, defaultValue: "" },
    department: { type: DataTypes.STRING, defaultValue: "" },
    workingHours: { type: DataTypes.STRING, defaultValue: "" }, // e.g. "Mon-Fri 9:00 AM - 5:00 PM"
    availabilityStatus: { type: DataTypes.BOOLEAN, defaultValue: true }, // available for booking right now

    // Patient-only fields
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
    gender: { type: DataTypes.ENUM("male", "female", "other", ""), defaultValue: "" },
    address: { type: DataTypes.STRING, defaultValue: "" },
    emergencyContactName: { type: DataTypes.STRING, defaultValue: "" },
    emergencyContactPhone: { type: DataTypes.STRING, defaultValue: "" },
    allergies: { type: DataTypes.TEXT, defaultValue: "" },
    vaccinationHistory: { type: DataTypes.TEXT, defaultValue: "" },

    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },

    // Password reset
    resetToken: { type: DataTypes.STRING, allowNull: true },
    resetTokenExpiry: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    hooks: {
      beforeSave: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

module.exports = User;
