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
  getVendorBidStatus,
  getVendorBids,
  getBidDetailsById,
  getVendorBidDetailedStatus,
  withdrawVendorBid
} = require("../controllers/tenderController");

router.post("/create", createTender);
router.post("/", createTender);
router.get("/", getAllTenders);

// Vendor Submitted Bids Directory & Details Routes (Registered before wildcard /:id)
router.get("/bids/vendor/:vendorId", getVendorBids);
router.get("/vendor/:vendorId/bids", getVendorBids);
router.get("/my-bids", getVendorBids);
router.get("/bids/:bidId/details", getBidDetailsById);
router.post("/bids/:bidId/withdraw", withdrawVendorBid);
router.post("/bids/withdraw", withdrawVendorBid);

// Vendor Eligibility ZKP Routes
router.get("/:tenderId/eligibility", getTenderEligibilityPolicy);
router.post("/:tenderId/eligibility/prove", proveEligibility);
router.post("/:tenderId/eligibility/verify", verifyEligibility);

const { getTenderEvaluationDetails } = require("../controllers/evaluationController");

// Dynamic Evaluation Policy & ZKP Bid Routes
router.get("/:tenderId/evaluation-policy", getEvaluationPolicy);
router.get("/:tenderId/evaluation/details", getTenderEvaluationDetails);
router.post("/:tenderId/generate-proof", generateProof);
router.post("/:tenderId/verify-proof", verifyProof);
router.post("/:tenderId/bids", submitVendorBid);
router.get("/:tenderId/bids/:vendorId/status", getVendorBidStatus);
router.get("/:tenderId/bids/:vendorId/details", getVendorBidDetailedStatus);
router.post("/:tenderId/bids/:vendorId/withdraw", withdrawVendorBid);

// Wildcard Single Tender Routes
router.get("/:id", getTenderById);
router.put("/:id/status", updateTenderStatus);

module.exports = router;
