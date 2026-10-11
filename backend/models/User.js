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
  did: { type: String, default: "" },
  primaryWallet: { type: String, default: "" },
  walletAddress: { type: String, default: "" },
  didMethod: { type: String, default: "ethr" },
  didNetwork: { type: String, default: "sepolia" },
  didCreatedAt: { type: Date },
  department: { type: String, default: "" },
  designation: { type: String, default: "" },
  clearanceLevel: { type: String, default: "Class-1 Government Officer (Level 5)" },
  badgeId: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
