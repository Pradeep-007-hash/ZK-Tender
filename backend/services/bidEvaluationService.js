/**
 * Bid Evaluation Service (AHP + Min-Max Normalization + WSM + Ranking)
 * 
 * Stage 1: ZKP Vendor Eligibility Filter
 * Stage 2: Multi-Criteria Decision Analysis (MCDA) for Eligible Vendors
 */

const RI_TABLE = {
  1: 0.0,
  2: 0.0,
  3: 0.58,
  4: 0.90,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49
};

/**
 * ALGORITHM 1: AHP (Analytic Hierarchy Process)
 * Validates pairwise matrix, calculates column sums, normalized matrix, priority vector (weights), and consistency ratio.
 */
function calculateAHPWeights(criteriaList, ahpMatrix) {
  if (!criteriaList || !Array.isArray(criteriaList) || criteriaList.length === 0) {
    throw new Error("AHP Error: Criteria list must be a non-empty array.");
  }
  const n = criteriaList.length;

  if (!ahpMatrix || !Array.isArray(ahpMatrix) || ahpMatrix.length !== n) {
    throw new Error(`AHP Error: Pairwise comparison matrix must be a ${n}x${n} 2D array.`);
  }

  // Validate square matrix structure and positive diagonal
  for (let i = 0; i < n; i++) {
    if (!Array.isArray(ahpMatrix[i]) || ahpMatrix[i].length !== n) {
      throw new Error(`AHP Error: Row ${i} of matrix must have length ${n}.`);
    }
    for (let j = 0; j < n; j++) {
      const val = Number(ahpMatrix[i][j]);
      if (isNaN(val) || val <= 0) {
        throw new Error(`AHP Error: Matrix element at [${i}][${j}] must be a positive number.`);
      }
    }
  }

  // 1. Calculate Column Sums
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += Number(ahpMatrix[i][j]);
    }
  }

  // 2. Normalize Matrix & Calculate Row Averages (Priority Vector / Weights)
  const normMatrix = Array.from({ length: n }, () => new Array(n).fill(0));
  const rawWeights = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      normMatrix[i][j] = Number(ahpMatrix[i][j]) / colSums[j];
      rowSum += normMatrix[i][j];
    }
    rawWeights[i] = rowSum / n;
  }

  // Normalize final weights so their sum is exactly 1.0
  const totalWeightSum = rawWeights.reduce((a, b) => a + b, 0);
  const weightsObj = {};
  criteriaList.forEach((crit, idx) => {
    const name = typeof crit === 'string' ? crit : (crit.name || crit.id || `crit_${idx}`);
    weightsObj[name] = Number((rawWeights[idx] / totalWeightSum).toFixed(4));
  });

  // 3. Consistency Ratio Calculation
  let lambdaMax = 0;
  for (let j = 0; j < n; j++) {
    const criterionName = typeof criteriaList[j] === 'string' ? criteriaList[j] : (criteriaList[j].name || criteriaList[j].id || `crit_${j}`);
    lambdaMax += colSums[j] * weightsObj[criterionName];
  }

  const ci = n > 2 ? (lambdaMax - n) / (n - 1) : 0;
  const ri = RI_TABLE[n] || 1.49;
  const cr = ri > 0 ? ci / ri : 0;

  const isConsistent = cr <= 0.10;

  if (!isConsistent) {
    throw new Error(`Pairwise comparison matrix is inconsistent (CR = ${cr.toFixed(4)} > 0.10 threshold). Please review the criterion comparisons.`);
  }

  return {
    weights: weightsObj,
    lambdaMax: Number(lambdaMax.toFixed(4)),
    consistencyIndex: Number(ci.toFixed(4)),
    consistencyRatio: Number(cr.toFixed(4)),
    isConsistent: true
  };
}

/**
 * ALGORITHM 2: MIN-MAX NORMALIZATION
 * Normalizes criterion values for Benefit (higher is better) and Cost (lower is better) criteria.
 * Handles edge case (max == min) by returning 1.0 for all candidates.
 */
function normalizeCriteria(bidsList, criteriaConfig) {
  if (!bidsList || !Array.isArray(bidsList) || bidsList.length === 0) {
    return [];
  }

  // Calculate min and max for each criterion
  const bounds = {};
  criteriaConfig.forEach(crit => {
    const cName = crit.name;
    let minVal = Infinity;
    let maxVal = -Infinity;

    bidsList.forEach(bid => {
      const val = Number(bid.criteria ? bid.criteria[cName] : 0);
      if (!isNaN(val)) {
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    });

    bounds[cName] = {
      min: minVal === Infinity ? 0 : minVal,
      max: maxVal === -Infinity ? 0 : maxVal,
      type: (crit.type || 'benefit').toLowerCase()
    };
  });

  // Apply Min-Max normalization
  return bidsList.map(bid => {
    const normalizedCriteria = {};
    criteriaConfig.forEach(crit => {
      const cName = crit.name;
      const { min, max, type } = bounds[cName];
      const rawVal = Number(bid.criteria ? bid.criteria[cName] : 0);

      if (isNaN(rawVal)) {
        normalizedCriteria[cName] = 0;
        return;
      }

      // Edge case: max == min (all vendors have identical scores for this criterion)
      if (max === min) {
        normalizedCriteria[cName] = 1.0;
      } else if (type === 'cost') {
        // Cost criterion: Lower is better -> (max - x) / (max - min)
        normalizedCriteria[cName] = Number(((max - rawVal) / (max - min)).toFixed(4));
      } else {
        // Benefit criterion: Higher is better -> (x - min) / (max - min)
        normalizedCriteria[cName] = Number(((rawVal - min) / (max - min)).toFixed(4));
      }
    });

    return {
      ...bid,
      normalizedCriteria
    };
  });
}

/**
 * ALGORITHM 3: WSM (Weighted Sum Model)
 * Final Score = Σ (weight_j * normalized_score_ij)
 */
function calculateWSMScores(normalizedBids, weights) {
  return normalizedBids.map(bid => {
    let score = 0;
    Object.keys(weights).forEach(critName => {
      const weight = Number(weights[critName] || 0);
      const normVal = Number(bid.normalizedCriteria ? bid.normalizedCriteria[critName] : 0);
      score += weight * normVal;
    });

    return {
      ...bid,
      finalScore: Number(score.toFixed(4)),
      scorePercentage: Number((score * 100).toFixed(2))
    };
  });
}

/**
 * ALGORITHM 4: RANKING & DETERMINISTIC TIE HANDLING
 * Sorts bids DESC by finalScore and resolves ties deterministically.
 */
function rankBids(wsmScoredBids) {
  if (!wsmScoredBids || wsmScoredBids.length === 0) return [];

  const sortedBids = [...wsmScoredBids].sort((a, b) => {
    // Primary sort: Final Score DESC
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }

    // Tie-breaker 1: Higher Technical score
    const techA = Number(a.criteria?.technical || 0);
    const techB = Number(b.criteria?.technical || 0);
    if (techB !== techA) return techB - techA;

    // Tie-breaker 2: Lower Financial/Price
    const priceA = Number(a.criteria?.financial || a.criteria?.price || Infinity);
    const priceB = Number(b.criteria?.financial || b.criteria?.price || Infinity);
    if (priceA !== priceB) return priceA - priceB;

    // Tie-breaker 3: Higher Experience
    const expA = Number(a.criteria?.experience || 0);
    const expB = Number(b.criteria?.experience || 0);
    if (expB !== expA) return expB - expA;

    return 0; // Exactly tied
  });

  return sortedBids.map((bid, idx) => ({
    ...bid,
    rank: idx + 1,
    isWinner: idx === 0
  }));
}

/**
 * COMPLETE PIPELINE HANDLER
 * Filters eligible bids ONLY -> AHP Weights -> Min-Max Normalization -> WSM Scoring -> Deterministic Ranking
 */
function evaluateTenderBids(tenderConfig, allVendorBids) {
  if (!allVendorBids || !Array.isArray(allVendorBids)) {
    throw new Error("Evaluation Error: Vendor bids list is required.");
  }

  // 1. Filter: Include ONLY ZKP-Verified Eligible Bids
  const eligibleBids = allVendorBids.filter(bid => {
    const isEligible = bid.eligible === true || 
                       bid.eligibilityStatus === 'VERIFIED' || 
                       bid.evaluation?.eligible === true ||
                       bid.proofValid === true;
    return isEligible;
  });

  if (eligibleBids.length === 0) {
    return {
      success: false,
      reason: "No ZKP-verified eligible bids available for evaluation.",
      tenderId: tenderConfig?.tenderId || 'T001',
      eligibleBidsCount: 0,
      totalBidsCount: allVendorBids.length,
      rankings: [],
      winner: null
    };
  }

  // 2. Criteria & AHP Weights Calculation
  const criteriaConfig = tenderConfig.criteriaConfig || [
    { name: 'technical', type: 'benefit' },
    { name: 'financial', type: 'cost' },
    { name: 'experience', type: 'benefit' },
    { name: 'sustainability', type: 'benefit' }
  ];

  let weights = tenderConfig.weights;
  let ahpSummary = null;

  if (tenderConfig.ahpMatrix) {
    ahpSummary = calculateAHPWeights(criteriaConfig, tenderConfig.ahpMatrix);
    weights = ahpSummary.weights;
  } else if (!weights) {
    // Default equal weights fallback if not specified
    const eqWeight = Number((1 / criteriaConfig.length).toFixed(4));
    weights = {};
    criteriaConfig.forEach(c => { weights[c.name] = eqWeight; });
  }

  // 3. Min-Max Normalization
  const normalizedBids = normalizeCriteria(eligibleBids, criteriaConfig);

  // 4. WSM Scoring
  const wsmScoredBids = calculateWSMScores(normalizedBids, weights);

  // 5. Ranking & Tie Handling
  const rankedBids = rankBids(wsmScoredBids);

  const winnerVendorId = rankedBids.length > 0 ? rankedBids[0].vendorId : null;

  return {
    success: true,
    tenderId: tenderConfig?.tenderId || 'T001',
    evaluationVersion: tenderConfig?.evaluationVersion || 1,
    eligibleBidsCount: eligibleBids.length,
    totalBidsCount: allVendorBids.length,
    criteriaConfig,
    weights,
    ahpSummary,
    rankings: rankedBids,
    winner: winnerVendorId,
    evaluatedAt: new Date().toISOString()
  };
}

module.exports = {
  calculateAHPWeights,
  normalizeCriteria,
  calculateWSMScores,
  rankBids,
  evaluateTenderBids,
  RI_TABLE
};
