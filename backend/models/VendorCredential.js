const mongoose = require("mongoose");

const VendorCredentialSchema = new mongoose.Schema({
  credentialId: { type: String, required: true, unique: true },
  vendorId: { type: String, required: true, index: true },
  applicationId: { type: String, default: "", index: true },
  vendorEmail: { type: String, default: "", index: true },
  vendorName: { type: String, default: "" },
  holderDid: { type: String, default: "" },
  type: { type: String, default: "VendorEligibilityCredential" },
  credentialData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  issuer: { type: String, default: "AUTHORIZED_GOVERNMENT_AUTHORITY" },
  signature: { type: String, required: true },
  algorithm: { type: String, default: "ML-DSA-65" },
  status: { type: String, default: "ACTIVE" },
  issuanceDate: { type: String, default: "" },
  expirationDate: { type: String, default: "" },
  daysRemaining: { type: Number, default: 365 },
  rawVc: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.models.VendorCredential || mongoose.model("VendorCredential", VendorCredentialSchema);
