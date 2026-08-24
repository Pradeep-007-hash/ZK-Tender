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
  submitVendorBid,
  getVendorBidStatus
} = require("../controllers/tenderController");

router.post("/create", createTender);
router.post("/", createTender);
router.get("/", getAllTenders);
router.get("/:id", getTenderById);
router.put("/:id/status", updateTenderStatus);

// Dynamic Evaluation Policy & ZKP Bid Routes
router.get("/:tenderId/evaluation-policy", getEvaluationPolicy);
router.post("/:tenderId/generate-proof", generateProof);
router.post("/:tenderId/verify-proof", verifyProof);
router.post("/:tenderId/bids", submitVendorBid);
router.get("/:tenderId/bids/:vendorId/status", getVendorBidStatus);

module.exports = router;
