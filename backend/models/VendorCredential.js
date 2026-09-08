const mongoose = require("mongoose");

const VendorCredentialSchema = new mongoose.Schema({
  credentialId: { type: String, required: true, unique: true },
  vendorId: { type: String, required: true, index: true },
  credentialData: {
    experience: { type: Number, required: true },
    turnover: { type: Number, required: true },
    projects: { type: Number, required: true },
    issuer: { type: String, default: "AUTHORIZED_GOVERNMENT_AUTHORITY" },
    issuedAt: { type: String },
    expiresAt: { type: String }
  },
  issuer: { type: String, default: "AUTHORIZED_GOVERNMENT_AUTHORITY" },
  signature: { type: String, required: true },
  algorithm: { type: String, default: "ML-DSA-65" },
  status: { type: String, default: "ACTIVE" }
}, { timestamps: true });

module.exports = mongoose.model("VendorCredential", VendorCredentialSchema);
