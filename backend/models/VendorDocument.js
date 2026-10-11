const mongoose = require("mongoose");

const VendorDocumentSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  vendorId: { type: String, required: true, index: true },
  vendorEmail: { type: String, required: true, index: true },
  vendorDid: { type: String, default: "" },
  documentName: { type: String, required: true },
  documentType: { 
    type: String, 
    enum: [
      "Company Registration Certificate",
      "GST Certificate", 
      "PAN / Tax Document",
      "PAN",
      "CA-Certified Turnover Certificate",
      "Financial Statement", 
      "Previous Project Documents",
      "Project Completion Certificate",
      "Experience Certificate", 
      "Other Supporting Documents"
    ], 
    required: true 
  },
  documentNumber: { type: String, default: "" },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  issuingAuthority: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  fileName: { type: String, default: "" },
  fileSize: { type: String, default: "1.2 MB" },
  fileType: { type: String, default: "application/pdf" },
  description: { type: String, default: "" },
  status: { 
    type: String, 
    enum: [
      "NOT_SUBMITTED", 
      "SUBMITTED", 
      "UNDER_REVIEW", 
      "VERIFIED", 
      "REJECTED", 
      "RESUBMISSION_REQUIRED",
      "Pending", 
      "Verified", 
      "Rejected", 
      "Requires Correction"
    ], 
    default: "UNDER_REVIEW" 
  },
  metadata: {
    financialYear: { type: String, default: "" },
    turnoverAmount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    caName: { type: String, default: "" },
    caRegistrationNo: { type: String, default: "" },
    projectName: { type: String, default: "" },
    clientName: { type: String, default: "" },
    projectValue: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    projectDescription: { type: String, default: "" }
  },
  reviewer: { type: String, default: "issuer@gov.in" },
  remarks: { type: String, default: "" },
  rejectionReason: { type: String, default: "" },
  rejectionNotes: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
  rejectedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.models.VendorDocument || mongoose.model("VendorDocument", VendorDocumentSchema);
