const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, required: true },
  actor: { type: String, required: true, default: "Issuer Admin (issuer@gov.in)" },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String, required: true },
  status: { type: String, default: "Success" },
  details: { type: String, default: "" },
  ipAddress: { type: String, default: "127.0.0.1" }
}, { timestamps: true });

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
