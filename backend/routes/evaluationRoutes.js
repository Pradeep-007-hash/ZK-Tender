const express = require("express");
const router = express.Router();
const {
  configureAHPWeights,
  runEvaluation,
  getEvaluationResults,
  getTenderEvaluationDetails,
  getVendorEvaluationResult,
  getAllVendorEvaluationResults,
  submitEvaluationClarification
} = require("../controllers/evaluationController");

// Vendor Evaluation Scorecard & Disclosed MCDA Routes (Registered first to avoid param capture)
router.get("/evaluation/vendor/:vendorId/list", getAllVendorEvaluationResults);
router.get("/evaluation/vendor/:vendorId", getAllVendorEvaluationResults);
router.get("/:tenderId/evaluation/vendor/:vendorId", getVendorEvaluationResult);
router.post("/:tenderId/evaluation/vendor/:vendorId/clarification", submitEvaluationClarification);

// Administrative Bid Evaluation Routes
router.post("/:tenderId/evaluation/weights", configureAHPWeights);
router.post("/:tenderId/evaluation/run", runEvaluation);
router.get("/:tenderId/evaluation/results", getEvaluationResults);
router.get("/:tenderId/evaluation/details", getTenderEvaluationDetails);

module.exports = router;

