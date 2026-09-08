const express = require("express");
const router = express.Router();
const { 
  createTender, 
  getAllTenders, 
  getTenderById, 
  updateTenderStatus,
  getEvaluationPolicy,
  generateProof,
  verifyProof,
  getTenderEligibilityPolicy,
  proveEligibility,
  verifyEligibility,
  submitVendorBid,
  getVendorBidStatus
} = require("../controllers/tenderController");

router.post("/create", createTender);
router.post("/", createTender);
router.get("/", getAllTenders);

// Vendor Eligibility ZKP Routes
router.get("/:tenderId/eligibility", getTenderEligibilityPolicy);
router.post("/:tenderId/eligibility/prove", proveEligibility);
router.post("/:tenderId/eligibility/verify", verifyEligibility);

// Dynamic Evaluation Policy & ZKP Bid Routes
router.get("/:tenderId/evaluation-policy", getEvaluationPolicy);
router.post("/:tenderId/generate-proof", generateProof);
router.post("/:tenderId/verify-proof", verifyProof);
router.post("/:tenderId/bids", submitVendorBid);
router.get("/:tenderId/bids/:vendorId/status", getVendorBidStatus);

// Wildcard Single Tender Routes
router.get("/:id", getTenderById);
router.put("/:id/status", updateTenderStatus);

module.exports = router;
