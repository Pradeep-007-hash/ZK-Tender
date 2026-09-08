const mongoose = require("mongoose");

const TenderPolicySchema = new mongoose.Schema({
  tenderId: { type: String, required: true, unique: true, index: true },
  policyVersion: { type: Number, default: 1 },
  policyData: {
    minimumExperience: { type: Number, required: true },
    minimumTurnover: { type: Number, required: true },
    minimumProjects: { type: Number, required: true },
    issuer: { type: String, default: "AUTHORIZED_GOVERNMENT_AUTHORITY" },
    issuedAt: { type: String },
    expiresAt: { type: String }
  },
  policyHash: { type: String, required: true },
  issuer: { type: String, default: "AUTHORIZED_GOVERNMENT_AUTHORITY" },
  signature: { type: String, required: true },
  algorithm: { type: String, default: "ML-DSA-65" },
  status: { type: String, default: "ACTIVE" }
}, { timestamps: true });

module.exports = mongoose.model("TenderPolicy", TenderPolicySchema);
