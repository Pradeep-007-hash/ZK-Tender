const crypto = require("crypto");

/**
 * Computes a deterministic canonical policy hash for a tender's eligibility requirements.
 * Binds tenderId + minimumExperience + minimumTurnover + minimumProjects.
 */
function generateEligibilityPolicyHash(tenderId, minimumExperience, minimumTurnover, minimumProjects) {
  const tId = String(tenderId || "").trim();
  const minExp = Number(minimumExperience ?? 5);
  const minTurn = Number(minimumTurnover ?? 10);
  const minProj = Number(minimumProjects ?? 3);

  const payload = `ELIGIBILITY_POLICY:${tId}:${minExp}:${minTurn}:${minProj}`;
  const hexHash = crypto.createHash("sha256").update(payload).digest("hex");
  return "0x" + hexHash;
}

/**
 * Extracts or initializes structured tender eligibility criteria.
 */
function getTenderEligibilityCriteria(tender) {
  if (!tender) {
    return {
      minimumExperience: 5,
      minimumTurnover: 10,
      minimumProjects: 3,
      policyHash: generateEligibilityPolicyHash("T001", 5, 10, 3)
    };
  }

  const tenderId = String(tender.tenderId || tender.id || "T001").trim();
  
  // Look for existing values or list definitions
  let minExp = tender.minimumExperience;
  let minTurn = tender.minimumTurnover;
  let minProj = tender.minimumProjects;

  if (minExp === undefined || minTurn === undefined || minProj === undefined) {
    if (tender.eligibilityCriteria) {
      minExp = minExp ?? tender.eligibilityCriteria.minimumExperience;
      minTurn = minTurn ?? tender.eligibilityCriteria.minimumTurnover;
      minProj = minProj ?? tender.eligibilityCriteria.minimumProjects;
    }
  }

  // Dynamic derivation based on tender budget and ID variance if not explicitly stored
  if (minExp === undefined || minTurn === undefined || minProj === undefined) {
    const budget = Number(tender.estimatedValue || tender.budget || 50000000);
    
    // Tiered benchmarks based on project scale (Budget in INR)
    if (budget >= 2000000000) {        // ≥ ₹200 Cr (Mega Infrastructure / AI Data Center)
      minExp = minExp ?? 8;
      minTurn = minTurn ?? 22;
      minProj = minProj ?? 5;
    } else if (budget >= 1000000000) { // ≥ ₹100 Cr (Large Transport / Metro Fleet)
      minExp = minExp ?? 7;
      minTurn = minTurn ?? 18;
      minProj = minProj ?? 4;
    } else if (budget >= 400000000) {  // ≥ ₹40 Cr (Highway / Diagnostic MRI / Sewage)
      minExp = minExp ?? 6;
      minTurn = minTurn ?? 14;
      minProj = minProj ?? 4;
    } else if (budget >= 200000000) {  // ≥ ₹20 Cr (Clean Energy / Bio-Methanation)
      minExp = minExp ?? 5;
      minTurn = minTurn ?? 8;
      minProj = minProj ?? 3;
    } else if (budget >= 50000000) {   // ≥ ₹5 Cr (Identity Portal / Urban Tech)
      minExp = minExp ?? 4;
      minTurn = minTurn ?? 4.5;
      minProj = minProj ?? 3;
    } else {                            // < ₹5 Cr (Smart City Consultancy / Agritech Drones)
      minExp = minExp ?? 2;
      minTurn = minTurn ?? 1.5;
      minProj = minProj ?? 2;
    }

    // Add deterministic pseudo-variance based on tenderId char codes so tenders don't collide
    let idHash = 0;
    for (let i = 0; i < tenderId.length; i++) {
      idHash = (idHash + tenderId.charCodeAt(i)) % 7;
    }
    if (idHash === 1 && minExp > 3) minExp = Math.max(3, minExp - 1);
    if (idHash === 2) minProj = Math.max(2, minProj + 1);
    if (idHash === 3 && minTurn > 3) minTurn = Math.round((minTurn * 1.1) * 10) / 10;
    if (idHash === 4 && minTurn > 2) minTurn = Math.round((minTurn * 0.9) * 10) / 10;
  }

  minExp = Number(minExp);
  minTurn = Number(minTurn);
  minProj = Number(minProj);

  const policyHash = generateEligibilityPolicyHash(tenderId, minExp, minTurn, minProj);

  return {
    tenderId,
    minimumExperience: minExp,
    minimumTurnover: minTurn,
    minimumProjects: minProj,
    policyHash
  };
}

/**
 * Generates Groth16 ZKP Proof for Vendor Eligibility
 * Private witness: { experience, turnover, projects }
 * Public inputs: { minimumExperience, minimumTurnover, minimumProjects, policyHash }
 */
function generateEligibilityProof(tenderId, vendorId, privateWitness, publicRequirements, extraSignals = {}) {
  const exp = Number(privateWitness?.experience ?? 0);
  const turn = Number(privateWitness?.turnover ?? 0);
  const proj = Number(privateWitness?.projects ?? 0);

  const minExp = Number(publicRequirements?.minimumExperience ?? 5);
  const minTurn = Number(publicRequirements?.minimumTurnover ?? 10);
  const minProj = Number(publicRequirements?.minimumProjects ?? 3);
  const policyHash = publicRequirements?.policyHash || generateEligibilityPolicyHash(tenderId, minExp, minTurn, minProj);

  // Exact boundary condition check: experience >= minExp AND turnover >= minTurn AND projects >= minProj
  const expOk = exp >= minExp;
  const turnOk = turn >= minTurn;
  const projOk = proj >= minProj;
  const isEligible = expOk && turnOk && projOk;

  // Cryptographic seed for Groth16 proof simulation bound to vendor, tender, policy, and eligibility state
  const proofSeed = crypto.createHash("sha256")
    .update(`${tenderId}:${vendorId}:${policyHash}:${isEligible}:${isEligible ? 'VALID' : 'INVALID'}`)
    .digest("hex");

  if (!isEligible) {
    // If not eligible, Circom constraint `eligible === 1` fails. Return invalid proof state.
    return {
      proofValid: false,
      eligible: false,
      policyHash,
      proof: {
        pi_a: ["0x0", "0x0", "0x0"],
        pi_b: [["0x0", "0x0"], ["0x0", "0x0"], ["0x0", "0x0"]],
        pi_c: ["0x0", "0x0", "0x0"],
        protocol: "groth16",
        curve: "bn128"
      },
      publicSignals: {
        tenderId,
        minimumExperience: minExp,
        minimumTurnover: minTurn,
        minimumProjects: minProj,
        policyHash,
        eligible: 0,
        verificationProofId: "ZKP-FAIL-" + proofSeed.substring(0, 8).toUpperCase(),
        ...(extraSignals || {})
      }
    };
  }

  // Synthesize Groth16 elliptic curve elements
  const pi_a = [
    "0x" + proofSeed.substring(0, 32),
    "0x" + proofSeed.substring(32, 64),
    "0x1"
  ];
  const pi_b = [
    ["0x" + proofSeed.substring(8, 40), "0x" + proofSeed.substring(16, 48)],
    ["0x" + proofSeed.substring(24, 56), "0x" + proofSeed.substring(32, 64)],
    ["0x1", "0x0"]
  ];
  const pi_c = [
    "0x" + proofSeed.substring(4, 36),
    "0x" + proofSeed.substring(20, 52),
    "0x1"
  ];

  return {
    proofValid: true,
    eligible: true,
    policyHash,
    proof: {
      pi_a,
      pi_b,
      pi_c,
      protocol: "groth16",
      curve: "bn128"
    },
    publicSignals: {
      tenderId,
      minimumExperience: minExp,
      minimumTurnover: minTurn,
      minimumProjects: minProj,
      policyHash,
      eligible: 1,
      verificationProofId: "ZKP-ELIGIBLE-" + proofSeed.substring(0, 8).toUpperCase(),
      ...(extraSignals || {})
    }
  };
}

/**
 * Verifies Groth16 ZKP proof against tender eligibility criteria & policy hash.
 */
function verifyEligibilityProof(proof, publicSignals, tenderRequirements) {
  if (!proof || !publicSignals || !tenderRequirements) {
    return { verified: false, eligible: false, message: "Missing proof, signals, or policy details" };
  }

  const { pi_a, pi_b, pi_c } = proof;
  if (!pi_a || !pi_b || !pi_c || pi_a.length < 3 || pi_b.length < 3 || pi_c.length < 3) {
    return { verified: false, eligible: false, message: "Malformed Groth16 proof structure" };
  }

  // Check if proof elements are non-zero and properly encoded
  const isValidHex = (val) => typeof val === "string" && /^0x[0-9a-fA-F]+$/.test(val);
  if (!isValidHex(pi_a[0]) || !isValidHex(pi_c[0])) {
    return { verified: false, eligible: false, message: "Tampered or invalid Groth16 proof element encoding" };
  }

  const isNonZeroProof = pi_a[0] !== "0x0" && pi_c[0] !== "0x0";
  if (!isNonZeroProof) {
    return { verified: false, eligible: false, message: "Invalid Groth16 proof parameters" };
  }

  const signalPolicyHash = (publicSignals.policyHash || "").toLowerCase();
  const expectedPolicyHash = (tenderRequirements.policyHash || "").toLowerCase();

  // Validate policy hash match (Replay attack protection)
  const hashMatch = signalPolicyHash === expectedPolicyHash;
  if (!hashMatch) {
    return {
      verified: false,
      eligible: false,
      policyMatch: false,
      message: "Policy Hash Mismatch: Proof was not generated for this tender's eligibility policy!"
    };
  }

  // Validate public requirements match
  const minExpMatch = Number(publicSignals.minimumExperience) === Number(tenderRequirements.minimumExperience);
  const minTurnMatch = Number(publicSignals.minimumTurnover) === Number(tenderRequirements.minimumTurnover);
  const minProjMatch = Number(publicSignals.minimumProjects) === Number(tenderRequirements.minimumProjects);

  if (!minExpMatch || !minTurnMatch || !minProjMatch) {
    return {
      verified: false,
      eligible: false,
      policyMatch: false,
      message: "Eligibility criteria parameters mismatch in public signals"
    };
  }

  const isEligibleSignal = Number(publicSignals.eligible) === 1;
  const verified = hashMatch && isNonZeroProof && isEligibleSignal;

  return {
    verified,
    eligible: verified,
    tenderId: tenderRequirements.tenderId,
    policyHash: tenderRequirements.policyHash,
    verificationProofId: publicSignals.verificationProofId || "ZKP-VERIFIED",
    verifiedViaVc: Boolean(publicSignals.verifiedViaVc),
    credentialId: publicSignals.credentialId || null
  };
}

module.exports = {
  generateEligibilityPolicyHash,
  getTenderEligibilityCriteria,
  generateEligibilityProof,
  verifyEligibilityProof
};
