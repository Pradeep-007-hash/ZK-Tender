const mongoose = require("mongoose");

const VerificationRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  verifier: { type: String, required: true },
  verifierDid: { type: String, default: "did:key:z6MkVerifier001Authority" },
  credentialId: { type: String, required: true },
  vendorDid: { type: String, required: true },
  requestedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Verified", "Rejected", "Expired"], default: "Pending" },
  notes: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.models.VerificationRequest || mongoose.model("VerificationRequest", VerificationRequestSchema);
