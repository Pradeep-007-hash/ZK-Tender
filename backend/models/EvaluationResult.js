const mongoose = require("mongoose");

const EvaluationResultSchema = new mongoose.Schema({
  tenderId: {
    type: String,
    required: true,
    index: true
  },
  evaluationVersion: {
    type: Number,
    default: 1
  },
  criteriaConfig: [
    {
      name: { type: String, required: true },
      type: { type: String, default: "benefit" }
    }
  ],
  ahpMatrix: {
    type: Array,
    default: []
  },
  weights: {
    type: Object,
    required: true
  },
  ahpSummary: {
    lambdaMax: Number,
    consistencyIndex: Number,
    consistencyRatio: Number,
    isConsistent: Boolean
  },
  eligibleBidsCount: {
    type: Number,
    default: 0
  },
  totalBidsCount: {
    type: Number,
    default: 0
  },
  rankings: [
    {
      rank: Number,
      vendorId: String,
      vendorName: String,
      finalScore: Number,
      scorePercentage: Number,
      isWinner: Boolean,
      criteria: Object,
      normalizedCriteria: Object
    }
  ],
  winner: {
    type: String,
    default: ""
  },
  evaluatedBy: {
    type: String,
    default: "Tender Authority"
  },
  evaluatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true, strict: false });

module.exports = mongoose.models.EvaluationResult || mongoose.model("EvaluationResult", EvaluationResultSchema);
