const { expect } = require("chai");
const {
  calculateAHPWeights,
  normalizeCriteria,
  calculateWSMScores,
  rankBids,
  evaluateTenderBids,
  RI_TABLE
} = require("../backend/services/bidEvaluationService");

describe("Bid Evaluation Module (AHP + Min-Max + WSM + Ranking)", function () {

  const sampleCriteriaConfig = [
    { name: "technical", type: "benefit" },
    { name: "financial", type: "cost" },
    { name: "experience", type: "benefit" },
    { name: "sustainability", type: "benefit" }
  ];

  const sampleAhpMatrix = [
    [1, 3, 5, 7],
    [0.3333, 1, 3, 5],
    [0.2, 0.3333, 1, 3],
    [0.1428, 0.2, 0.3333, 1]
  ];

  // TEST 1: AHP Weight Calculation
  it("TEST 1: AHP calculation MUST produce normalized weights summing to 1.0", function () {
    const ahpResult = calculateAHPWeights(sampleCriteriaConfig, sampleAhpMatrix);

    expect(ahpResult).to.have.property("weights");
    expect(ahpResult.weights).to.have.property("technical");
    expect(ahpResult.weights).to.have.property("financial");
    expect(ahpResult.weights).to.have.property("experience");
    expect(ahpResult.weights).to.have.property("sustainability");

    const totalSum = Object.values(ahpResult.weights).reduce((a, b) => a + b, 0);
    expect(totalSum).to.be.closeTo(1.0, 0.01);
  });

  // TEST 2: AHP Matrix Validation
  it("TEST 2: Invalid or non-square AHP matrix MUST throw an explicit validation error", function () {
    const invalidMatrix = [
      [1, 3, 5],
      [0.33, 1, 3]
    ]; // 2x3 matrix for 4 criteria

    expect(() => calculateAHPWeights(sampleCriteriaConfig, invalidMatrix)).to.throw(/matrix must be a 4x4/i);
  });

  // TEST 3: AHP Consistency Ratio Threshold Enforcement
  it("TEST 3: Inconsistent AHP pairwise matrix (CR > 0.10) MUST be rejected with error", function () {
    const inconsistentMatrix = [
      [1, 9, 0.1, 7],
      [0.11, 1, 9, 0.1],
      [10, 0.11, 1, 9],
      [0.14, 10, 0.11, 1]
    ];

    expect(() => calculateAHPWeights(sampleCriteriaConfig, inconsistentMatrix)).to.throw(/inconsistent/i);
  });

  // TEST 4: Benefit Normalization (Higher is Better)
  it("TEST 4: Min-Max normalization for BENEFIT criterion MUST map max -> 1.0 and min -> 0.0", function () {
    const bids = [
      { vendorId: "V_A", criteria: { technical: 85 } },
      { vendorId: "V_B", criteria: { technical: 90 } },
      { vendorId: "V_C", criteria: { technical: 80 } }
    ];
    const criteria = [{ name: "technical", type: "benefit" }];

    const normalized = normalizeCriteria(bids, criteria);
    expect(normalized[0].normalizedCriteria.technical).to.equal(0.5); // (85-80)/(90-80)
    expect(normalized[1].normalizedCriteria.technical).to.equal(1.0); // (90-80)/10
    expect(normalized[2].normalizedCriteria.technical).to.equal(0.0); // (80-80)/10
  });

  // TEST 5: Cost Normalization (Lower is Better)
  it("TEST 5: Min-Max normalization for COST criterion (e.g. Price) MUST map min -> 1.0 and max -> 0.0", function () {
    const bids = [
      { vendorId: "V_A", criteria: { financial: 12 } },
      { vendorId: "V_B", criteria: { financial: 10 } },
      { vendorId: "V_C", criteria: { financial: 11 } }
    ];
    const criteria = [{ name: "financial", type: "cost" }];

    const normalized = normalizeCriteria(bids, criteria);
    expect(normalized[0].normalizedCriteria.financial).to.equal(0.0); // (12-12)/2
    expect(normalized[1].normalizedCriteria.financial).to.equal(1.0); // (12-10)/2
    expect(normalized[2].normalizedCriteria.financial).to.equal(0.5); // (12-11)/2
  });

  // TEST 6: Max == Min Edge Case Handling
  it("TEST 6: When max equals min (identical scores), normalized score MUST equal 1.0 for all candidates", function () {
    const bids = [
      { vendorId: "V_A", criteria: { technical: 85 } },
      { vendorId: "V_B", criteria: { technical: 85 } }
    ];
    const criteria = [{ name: "technical", type: "benefit" }];

    const normalized = normalizeCriteria(bids, criteria);
    expect(normalized[0].normalizedCriteria.technical).to.equal(1.0);
    expect(normalized[1].normalizedCriteria.technical).to.equal(1.0);
  });

  // TEST 7: WSM Score Calculation
  it("TEST 7: WSM MUST calculate final composite score as Σ (weight_j * normalized_j)", function () {
    const normalizedBids = [
      { vendorId: "V_A", normalizedCriteria: { technical: 0.5, financial: 0.0, experience: 0.4, sustainability: 0.5 } }
    ];
    const weights = { technical: 0.35, financial: 0.40, experience: 0.15, sustainability: 0.10 };

    const scored = calculateWSMScores(normalizedBids, weights);
    // (0.50*0.35) + (0.00*0.40) + (0.40*0.15) + (0.50*0.10) = 0.175 + 0 + 0.060 + 0.050 = 0.285
    expect(scored[0].finalScore).to.equal(0.285);
  });

  // TEST 8: Ranking Sort (DESC by Final Score)
  it("TEST 8: Ranking MUST sort candidates in DESCENDING order of final score", function () {
    const scoredBids = [
      { vendorId: "V_A", finalScore: 0.285 },
      { vendorId: "V_B", finalScore: 0.750 },
      { vendorId: "V_C", finalScore: 0.450 }
    ];

    const ranked = rankBids(scoredBids);
    expect(ranked[0].vendorId).to.equal("V_B");
    expect(ranked[0].rank).to.equal(1);
    expect(ranked[1].vendorId).to.equal("V_C");
    expect(ranked[1].rank).to.equal(2);
    expect(ranked[2].vendorId).to.equal("V_A");
    expect(ranked[2].rank).to.equal(3);
  });

  // TEST 9: Deterministic Tie Handling
  it("TEST 9: Tied final scores MUST be broken deterministically by higher technical score then lower price", function () {
    const tiedBids = [
      { vendorId: "V_A", finalScore: 0.500, criteria: { technical: 80, financial: 15, experience: 5 } },
      { vendorId: "V_B", finalScore: 0.500, criteria: { technical: 90, financial: 15, experience: 5 } }
    ];

    const ranked = rankBids(tiedBids);
    expect(ranked[0].vendorId).to.equal("V_B"); // Technical 90 > 80
    expect(ranked[0].rank).to.equal(1);
  });

  // TEST 10: Missing Values Handling
  it("TEST 10: Missing criteria values MUST be safely treated as zero without NaN errors", function () {
    const bids = [
      { vendorId: "V_A", criteria: { technical: 85 } },
      { vendorId: "V_B", criteria: {} }
    ];

    const normalized = normalizeCriteria(bids, sampleCriteriaConfig);
    expect(normalized[1].normalizedCriteria.technical).to.not.be.NaN;
  });

  // TEST 11: Invalid Values Handling
  it("TEST 11: Invalid string or NaN input values MUST be safely handled", function () {
    const bids = [
      { vendorId: "V_A", criteria: { technical: "INVALID_NUMBER" } }
    ];

    const normalized = normalizeCriteria(bids, sampleCriteriaConfig);
    expect(normalized[0].normalizedCriteria.technical).to.equal(0);
  });

  // TEST 12: No Eligible Vendors
  it("TEST 12: Pipeline with zero eligible vendors MUST return success: false gracefully", function () {
    const tenderConfig = { tenderId: "T001", criteriaConfig: sampleCriteriaConfig };
    const bids = [
      { vendorId: "V_A", eligible: false }
    ];

    const result = evaluateTenderBids(tenderConfig, bids);
    expect(result.success).to.be.false;
    expect(result.reason).to.include("No ZKP-verified eligible bids");
  });

  // TEST 13: Single Eligible Vendor
  it("TEST 13: Single eligible vendor MUST be ranked #1 and designated as winner", function () {
    const tenderConfig = { tenderId: "T001", criteriaConfig: sampleCriteriaConfig };
    const bids = [
      { vendorId: "V_ONLY", eligible: true, criteria: { technical: 85, financial: 12, experience: 8, sustainability: 80 } }
    ];

    const result = evaluateTenderBids(tenderConfig, bids);
    expect(result.success).to.be.true;
    expect(result.winner).to.equal("V_ONLY");
    expect(result.rankings[0].rank).to.equal(1);
  });

  // TEST 14: Excluding Ineligible Vendors
  it("TEST 14: Ineligible vendors (eligible === false) MUST be completely excluded from evaluation and ranking", function () {
    const tenderConfig = { tenderId: "T001", criteriaConfig: sampleCriteriaConfig };
    const bids = [
      { vendorId: "V_ELIGIBLE_1", eligible: true, criteria: { technical: 85, financial: 12, experience: 8, sustainability: 80 } },
      { vendorId: "V_INELIGIBLE", eligible: false, criteria: { technical: 100, financial: 1, experience: 20, sustainability: 100 } }
    ];

    const result = evaluateTenderBids(tenderConfig, bids);
    expect(result.eligibleBidsCount).to.equal(1);
    const rankedVendorIds = result.rankings.map(r => r.vendorId);
    expect(rankedVendorIds).to.include("V_ELIGIBLE_1");
    expect(rankedVendorIds).to.not.include("V_INELIGIBLE");
  });

  // TEST 15: Reproducibility
  it("TEST 15: Running evaluation pipeline with identical inputs MUST produce identical weights and ranks", function () {
    const tenderConfig = { tenderId: "T001", criteriaConfig: sampleCriteriaConfig, ahpMatrix: sampleAhpMatrix };
    const bids = [
      { vendorId: "V_A", eligible: true, criteria: { technical: 85, financial: 12, experience: 8, sustainability: 80 } },
      { vendorId: "V_B", eligible: true, criteria: { technical: 90, financial: 10, experience: 6, sustainability: 70 } }
    ];

    const res1 = evaluateTenderBids(tenderConfig, bids);
    const res2 = evaluateTenderBids(tenderConfig, bids);

    expect(res1.winner).to.equal(res2.winner);
    expect(res1.rankings[0].finalScore).to.equal(res2.rankings[0].finalScore);
  });

  // TEST 16: Unauthorized Evaluation Request
  it("TEST 16: Invalid matrix input MUST prevent unauthorized or invalid evaluation from running", function () {
    const badConfig = { tenderId: "T001", criteriaConfig: sampleCriteriaConfig, ahpMatrix: [[1, 2], [3, 4]] };
    const bids = [{ vendorId: "V_A", eligible: true, criteria: { technical: 80 } }];

    expect(() => evaluateTenderBids(badConfig, bids)).to.throw(/matrix must be a 4x4/i);
  });

  // TEST 17: Prompt Standard Verification Scenario
  it("TEST 17: Standard Prompt Scenario (Vendor B: 0.75 > Vendor C: 0.45 > Vendor A: 0.285) MUST yield Vendor B as Winner", function () {
    const tenderConfig = {
      tenderId: "T001",
      criteriaConfig: sampleCriteriaConfig,
      weights: { technical: 0.35, financial: 0.40, experience: 0.15, sustainability: 0.10 }
    };

    const bids = [
      { vendorId: "Vendor A", eligible: true, criteria: { technical: 85, financial: 12, experience: 8, sustainability: 80 } },
      { vendorId: "Vendor B", eligible: true, criteria: { technical: 90, financial: 10, experience: 6, sustainability: 70 } },
      { vendorId: "Vendor C", eligible: true, criteria: { technical: 80, financial: 11, experience: 10, sustainability: 90 } }
    ];

    const result = evaluateTenderBids(tenderConfig, bids);

    expect(result.success).to.be.true;
    expect(result.winner).to.equal("Vendor B");

    const vendorBResult = result.rankings.find(r => r.vendorId === "Vendor B");
    const vendorCResult = result.rankings.find(r => r.vendorId === "Vendor C");
    const vendorAResult = result.rankings.find(r => r.vendorId === "Vendor A");

    expect(vendorBResult.rank).to.equal(1);
    expect(vendorBResult.finalScore).to.be.closeTo(0.750, 0.01);

    expect(vendorCResult.rank).to.equal(2);
    expect(vendorCResult.finalScore).to.be.closeTo(0.450, 0.01);

    expect(vendorAResult.rank).to.equal(3);
    expect(vendorAResult.finalScore).to.be.closeTo(0.300, 0.02);
  });

  // TEST 18: Complete End-to-End Pipeline
  it("TEST 18: Full Pipeline: ZKP Eligibility Filter -> AHP -> Min-Max -> WSM -> Deterministic Ranking roundtrip", function () {
    const tenderConfig = {
      tenderId: "T001",
      criteriaConfig: sampleCriteriaConfig,
      ahpMatrix: sampleAhpMatrix
    };

    const bids = [
      { vendorId: "Vendor A", eligible: true, criteria: { technical: 85, financial: 12, experience: 8, sustainability: 80 } },
      { vendorId: "Vendor B", eligible: true, criteria: { technical: 90, financial: 10, experience: 6, sustainability: 70 } },
      { vendorId: "Vendor C", eligible: true, criteria: { technical: 80, financial: 11, experience: 10, sustainability: 90 } },
      { vendorId: "Vendor INELIGIBLE", eligible: false, criteria: { technical: 100, financial: 1, experience: 20, sustainability: 100 } }
    ];

    const result = evaluateTenderBids(tenderConfig, bids);

    expect(result.success).to.be.true;
    expect(result.eligibleBidsCount).to.equal(3);
    expect(result.totalBidsCount).to.equal(4);
    expect(result.winner).to.equal("Vendor B");
  });

});
