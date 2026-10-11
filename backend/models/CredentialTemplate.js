const mongoose = require("mongoose");

const CredentialTemplateSchema = new mongoose.Schema({
  templateId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  fields: [{ type: String }],
  defaultValidityDays: { type: Number, default: 365 },
  issuerDid: { type: String, default: "did:key:z6MkIssuer001GovTenderAuthority" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.CredentialTemplate || mongoose.model("CredentialTemplate", CredentialTemplateSchema);
