const {
  calculateAHPWeights,
  evaluateTenderBids
} = require("../services/bidEvaluationService");

const Tender = require("../models/Tender");
const VendorBid = require("../models/VendorBid");
const VendorEligibility = require("../models/VendorEligibility");
const EvaluationResult = require("../models/EvaluationResult");

// 1. POST /api/tenders/:tenderId/evaluation/weights — Configure AHP pairwise matrix & calculate weights
exports.configureAHPWeights = async (req, res) => {
  try {
    const { tenderId } = req.params;
    const { criteriaConfig, ahpMatrix } = req.body;

    if (!criteriaConfig || !ahpMatrix) {
      return res.status(400).json({ success: false, message: "criteriaConfig and ahpMatrix are required." });
    }

    // Calculate AHP weights and validate consistency ratio (CR <= 0.10)
    const ahpSummary = calculateAHPWeights(criteriaConfig, ahpMatrix);

    // Save to Tender model in MongoDB
    await Tender.findOneAndUpdate(
      { tenderId },
      {
        $set: {
          evaluationCriteriaList: criteriaConfig,
          ahpMatrix,
          evaluationWeights: ahpSummary.weights,
          ahpSummary
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: "AHP pairwise matrix validated and criterion weights calculated successfully.",
      tenderId,
      weights: ahpSummary.weights,
      ahpSummary
    });
  } catch (error) {
    console.error("[AHP WEIGHTS CONFIG ERROR]", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// 2. POST /api/tenders/:tenderId/evaluation/run — Run evaluation pipeline on eligible bids
exports.runEvaluation = async (req, res) => {
  try {
    const { tenderId } = req.params;

    // Fetch Tender Configuration
    let tender = await Tender.findOne({ tenderId });
    const criteriaConfig = (tender && tender.evaluationCriteriaList && tender.evaluationCriteriaList.length > 0)
      ? tender.evaluationCriteriaList
      : [
          { name: 'technical', type: 'benefit' },
          { name: 'financial', type: 'cost' },
          { name: 'experience', type: 'benefit' },
          { name: 'sustainability', type: 'benefit' }
        ];

    const ahpMatrix = (tender && tender.ahpMatrix && tender.ahpMatrix.length > 0)
      ? tender.ahpMatrix
      : null;

    const evaluationWeights = (tender && tender.evaluationWeights)
      ? tender.evaluationWeights
      : null;

    // Fetch All Vendor Bids for Tender
    let vendorBids = await VendorBid.find({ tenderId }).lean();

    // Cross-reference with VendorEligibility collection to ensure ZKP eligibility status
    const verifiedEligibilityRecords = await VendorEligibility.find({ tenderId, verified: true }).lean();
    const verifiedVendorSet = new Set(verifiedEligibilityRecords.map(r => r.vendorId));

    // Enrich vendor bids with ZKP eligibility flag
    const enrichedVendorBids = vendorBids.map(bid => {
      const isEligibleInRecord = verifiedVendorSet.has(bid.vendorId);
      const isEligibleInBid = bid.eligible === true || bid.eligibilityStatus === 'VERIFIED' || bid.evaluation?.eligible === true;
      const eligible = isEligibleInRecord || isEligibleInBid;

      // Extract numerical criteria responses
      const criteriaObj = {};
      if (bid.criteria) {
        Object.assign(criteriaObj, bid.criteria);
      } else if (Array.isArray(bid.responses)) {
        bid.responses.forEach(resp => {
          if (resp.criterionName) {
            criteriaObj[resp.criterionName.toLowerCase()] = Number(resp.data?.value || resp.data || 0);
          }
        });
      }

      return {
        ...bid,
        eligible,
        eligibilityStatus: eligible ? 'VERIFIED' : 'NOT_ELIGIBLE',
        criteria: criteriaObj
      };
    });

    const tenderConfig = {
      tenderId,
      criteriaConfig,
      ahpMatrix,
      weights: evaluationWeights
    };

    // Execute Evaluation Pipeline (AHP -> Min-Max -> WSM -> Ranking)
    const evalResult = evaluateTenderBids(tenderConfig, enrichedVendorBids);

    if (!evalResult.success) {
      return res.status(400).json({ success: false, message: evalResult.reason, result: evalResult });
    }

    // Save/Update in MongoDB EvaluationResult collection
    const savedRecord = await EvaluationResult.findOneAndUpdate(
      { tenderId },
      {
        tenderId,
        evaluationVersion: (tender?.evaluationVersion || 0) + 1,
        criteriaConfig,
        ahpMatrix: ahpMatrix || [],
        weights: evalResult.weights,
        ahpSummary: evalResult.ahpSummary,
        eligibleBidsCount: evalResult.eligibleBidsCount,
        totalBidsCount: evalResult.totalBidsCount,
        rankings: evalResult.rankings,
        winner: evalResult.winner,
        evaluatedBy: req.user?.name || "Tender Authority",
        evaluatedAt: new Date()
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: "Bid evaluation completed successfully.",
      evaluationResult: savedRecord
    });
  } catch (error) {
    console.error("[RUN EVALUATION ERROR]", error);
    return res.status(500).json({ success: false, message: "Server error executing bid evaluation." });
  }
};

// 3. GET /api/tenders/:tenderId/evaluation/results — Fetch Evaluation Results & Ranking
exports.getEvaluationResults = async (req, res) => {
  try {
    const { tenderId } = req.params;
    const record = await EvaluationResult.findOne({ tenderId }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(404).json({ success: false, message: `No evaluation results found for Tender ${tenderId}.` });
    }

    return res.status(200).json({
      success: true,
      evaluationResult: record
    });
  } catch (error) {
    console.error("[GET EVALUATION RESULTS ERROR]", error);
    return res.status(500).json({ success: false, message: "Server error fetching evaluation results." });
  }
};
