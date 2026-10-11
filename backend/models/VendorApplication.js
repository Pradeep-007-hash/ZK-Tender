const mongoose = require("mongoose");

const VendorApplicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true },
  vendorId: { type: String, required: true, index: true },
  vendorEmail: { type: String, required: true },
  vendorName: { type: String, required: true },
  vendorDid: { type: String, required: true },
  companyName: { type: String, required: true },
  registrationNumber: { type: String, default: "REG-2024-9981" },
  gstNumber: { type: String, default: "07AAAAA0000A1Z5" },
  panNumber: { type: String, default: "ABCDE1234F" },
  address: { type: String, default: "Tech Park, Phase 2, New Delhi, India" },
  phone: { type: String, default: "+91 98765 43210" },
  experienceYears: { type: Number, default: 8 },
  annualTurnoverCr: { type: Number, default: 25 },
  previousProjects: { type: Number, default: 7 },
  completedProjects: { type: Number, default: 7 },
  currentProjects: { type: Number, default: 2 },
  status: { 
    type: String, 
    enum: ["Pending", "Under Review", "Verified", "Rejected", "Approved", "Credential Issued"], 
    default: "Pending" 
  },
  applicationStep: { type: Number, default: 1 }, // 1: Submission, 2: Verification, 3: Issuance, 4: Tender Eligible
  stepName: { type: String, default: "Document Submission" },
  nextStep: { type: String, default: "Document Verification" },
  allocatedCredentialId: { type: String, default: "" },
  identityVerified: { type: Boolean, default: false },
  documentVerificationStatus: { type: String, default: "Pending" },
  eligibilityStatus: { type: String, default: "Pending" },
  credentialStatus: { type: String, default: "Not Issued" },
  trustedSources: {
    gstDatabase: { type: String, default: "Verified" },
    companyRegistry: { type: String, default: "Verified" },
    financialRecords: { type: String, default: "Verified font" },
    projectAuthority: { type: String, default: "Verified" }
  },
  rejectionReason: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: String, default: "issuer@gov.in" }
}, { timestamps: true });

module.exports = mongoose.models.VendorApplication || mongoose.model("VendorApplication", VendorApplicationSchema);
