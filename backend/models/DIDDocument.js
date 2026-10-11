const mongoose = require("mongoose");

const DIDDocumentSchema = new mongoose.Schema({
  did: { type: String, required: true, unique: true },
  controller: { type: String, required: true },
  status: { type: String, default: "Active" },
  verificationMethod: [
    {
      id: { type: String, required: true },
      type: { type: String, default: "Ed25519VerificationKey2020" },
      controller: { type: String, required: true },
      publicKeyMultibase: { type: String, required: true }
    }
  ],
  authentication: [{ type: String }],
  assertionMethod: [{ type: String }],
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.DIDDocument || mongoose.model("DIDDocument", DIDDocumentSchema);
