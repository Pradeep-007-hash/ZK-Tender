const mongoose = require('mongoose');

const VendorBidSchema = new mongoose.Schema({
  tenderId: {
    type: String,
    required: true,
    index: true
  },
  vendorId: {
    type: String,
    required: true,
    index: true
  },
  vendorName: {
    type: String,
    default: 'Anonymous Vendor'
  },
  criteriaHash: {
    type: String,
    required: true
  },
  responses: [
    {
      criterionId: { type: String, required: true },
      criterionName: { type: String, default: '' },
      criterionType: { type: String, required: true },
      data: { type: Object, default: {} },
      documents: [
        {
          fileName: { type: String, default: '' },
          documentType: { type: String, default: '' },
          fileHash: { type: String, default: '' },
          fileSize: { type: String, default: '' },
          uploadedAt: { type: String, default: '' },
          verifiedStatus: { type: String, default: 'VERIFIED' }
        }
      ]
    }
  ],
  proof: {
    pi_a: { type: Array, default: [] },
    pi_b: { type: Array, default: [] },
    pi_c: { type: Array, default: [] },
    protocol: { type: String, default: 'groth16' },
    curve: { type: String, default: 'bn128' }
  },
  publicSignals: {
    type: Object,
    default: {}
  },
  proofValid: {
    type: Boolean,
    default: false
  },
  evaluation: {
    eligible: { type: Boolean, default: false },
    finalScore: { type: Number, default: 0 },
    passingScore: { type: Number, default: 70 },
    criteriaResults: { type: Array, default: [] },
    evaluatedAt: { type: Date, default: Date.now }
  },
  txHash: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  clarifications: {
    type: Array,
    default: []
  }
}, { strict: false });


// Enforce single application per vendor per tender constraint
VendorBidSchema.index({ tenderId: 1, vendorId: 1 }, { unique: true });

module.exports = mongoose.model('VendorBid', VendorBidSchema);
