const mongoose = require("mongoose");

const VendorEligibilitySchema = new mongoose.Schema({
  vendorId: {
    type: String,
    required: true,
    index: true
  },
  tenderId: {
    type: String,
    required: true,
    index: true
  },
  policyHash: {
    type: String,
    required: true,
    index: true
  },
  proof: {
    type: Object,
    required: true
  },
  publicSignals: {
    type: Object,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true, strict: false });

module.exports = mongoose.models.VendorEligibility || mongoose.model("VendorEligibility", VendorEligibilitySchema);
