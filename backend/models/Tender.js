const mongoose = require("mongoose");

const TenderSchema = new mongoose.Schema({
  tenderId: {
    type: String,
    required: true,
    unique: true
  },
  refNumber: {
    type: String,
    default: ""
  },
  title: {
    type: String,
    required: true
  },
  department: {
    type: String,
    default: "Dept of Urban Tech"
  },
  category: {
    type: String,
    default: "Infrastructure"
  },
  tenderType: {
    type: String,
    default: "E-Tender"
  },
  procurementMethod: {
    type: String,
    default: "Competitive Bidding"
  },
  budgetType: {
    type: String,
    default: "Estimated Budget"
  },
  estimatedValue: {
    type: Number,
    required: true
  },
  bidPriceRestriction: {
    type: String,
    default: "Minimum + Maximum"
  },
  minBid: {
    type: Number,
    default: 0
  },
  maxBidCeiling: {
    type: Number,
    default: 0
  },
  emdType: {
    type: String,
    default: "Fixed Amount"
  },
  emdAmount: {
    type: Number,
    default: 500000
  },
  emdPercentage: {
    type: Number,
    default: 2
  },
  emdExemptionApplicable: {
    type: String,
    default: "Yes"
  },
  tenderFeeType: {
    type: String,
    default: "Fee Required"
  },
  docFeeAmount: {
    type: Number,
    default: 10000
  },
  docFeeCurrency: {
    type: String,
    default: "INR (₹)"
  },
  country: {
    type: String,
    default: "India"
  },
  state: {
    type: String,
    default: "Maharashtra"
  },
  district: {
    type: String,
    default: ""
  },
  city: {
    type: String,
    default: ""
  },
  workAddress: {
    type: String,
    default: ""
  },
  contractDuration: {
    type: Number,
    default: 24
  },
  contractDurationUnit: {
    type: String,
    default: "Months"
  },
  expectedStartDate: {
    type: String,
    default: ""
  },
  expectedCompletionDate: {
    type: String,
    default: ""
  },
  detailedScope: {
    type: String,
    default: ""
  },
  executiveSummary: {
    type: String,
    default: ""
  },
  pubDate: {
    type: String,
    default: ""
  },
  bidStartDate: {
    type: String,
    default: ""
  },
  preBidDate: {
    type: String,
    default: ""
  },
  clarificationDeadline: {
    type: String,
    default: ""
  },
  submissionDeadline: {
    type: String,
    default: ""
  },
  techEvalStartDate: {
    type: String,
    default: ""
  },
  techEvalEndDate: {
    type: String,
    default: ""
  },
  finEvalStartDate: {
    type: String,
    default: ""
  },
  finEvalEndDate: {
    type: String,
    default: ""
  },
  awardDate: {
    type: String,
    default: ""
  },
  eligibilityRequirementsList: {
    type: Array,
    default: []
  },
  requiredDocsList: {
    type: Array,
    default: []
  },
  submissionType: {
    type: String,
    default: "Two Stage / Two Cover"
  },
  validityPeriodDays: {
    type: Number,
    default: 120
  },
  allowModification: {
    type: String,
    default: "Allowed"
  },
  allowWithdrawal: {
    type: String,
    default: "Allowed"
  },
  multipleBidSubmission: {
    type: String,
    default: "Not Allowed"
  },
  financialBidEncryption: {
    type: String,
    default: "Enabled"
  },
  evaluationMethod: {
    type: String,
    default: "QCBS"
  },
  evaluationCriteriaList: {
    type: Array,
    default: []
  },
  totalWeight: {
    type: Number,
    default: 100
  },
  zkpActive: {
    type: Boolean,
    default: true
  },
  zkpConfig: {
    type: Object,
    default: {}
  },
  governancePoliciesList: {
    type: Array,
    default: []
  },
  tenderSpecificRulesList: {
    type: Array,
    default: []
  },
  attachmentsList: {
    type: Array,
    default: []
  },
  contractHash: {
    type: String,
    default: ""
  },
  contractAddress: {
    type: String,
    default: ""
  },
  txHash: {
    type: String,
    default: ""
  },
  onChainTenderNumber: {
    type: Number,
    default: 0
  },
  locationHash: {
    type: String,
    default: ""
  },
  scopeHash: {
    type: String,
    default: ""
  },
  eligibilityHash: {
    type: String,
    default: ""
  },
  documentsHash: {
    type: String,
    default: ""
  },
  evaluationHash: {
    type: String,
    default: ""
  },
  zkpConfigHash: {
    type: String,
    default: ""
  },
  governancePolicyHash: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    default: "Published"
  },
  bidsCount: {
    type: Number,
    default: 0
  },
  zkpRule: {
    type: String,
    default: ""
  },
  createdBy: {
    type: String,
    default: "Authority Officer"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { strict: false });

module.exports = mongoose.model("Tender", TenderSchema);
