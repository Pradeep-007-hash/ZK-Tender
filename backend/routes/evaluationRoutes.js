const express = require("express");
const router = express.Router();
const {
  configureAHPWeights,
  runEvaluation,
  getEvaluationResults
} = require("../controllers/evaluationController");

// Bid Evaluation Routes
router.post("/:tenderId/evaluation/weights", configureAHPWeights);
router.post("/:tenderId/evaluation/run", runEvaluation);
router.get("/:tenderId/evaluation/results", getEvaluationResults);

module.exports = router;
