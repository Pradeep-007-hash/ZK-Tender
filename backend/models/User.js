const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, default: "Enterprise User" },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: "VENDOR" },
  organizationId: { type: String, default: "" },
  company: { type: String, default: "" },
  phone: { type: String, default: "" },
  gstNo: { type: String, default: "" },
  address: { type: String, default: "" },
  experienceYears: { type: Number, default: 8 },
  annualTurnoverCr: { type: Number, default: 25 },
  completedProjects: { type: Number, default: 7 },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  otpCode: String,
  otpExpires: Date,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
