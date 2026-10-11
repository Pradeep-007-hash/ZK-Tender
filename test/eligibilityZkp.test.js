const { expect } = require("chai");
const {
  generateEligibilityPolicyHash,
  getTenderEligibilityCriteria,
  generateEligibilityProof,
  verifyEligibilityProof
} = require("../backend/services/zkpEligibilityEngine");

describe("Vendor Eligibility ZKP Verification Engine", function () {
  
  // Define Tender Criteria Policies
  const tenderT001Reqs = {
    tenderId: "T001",
    minimumExperience: 5,
    minimumTurnover: 10,
    minimumProjects: 3,
    policyHash: generateEligibilityPolicyHash("T001", 5, 10, 3)
  };

  const tenderT002Reqs = {
    tenderId: "T002",
    minimumExperience: 10,
    minimumTurnover: 50,
    minimumProjects: 5,
    policyHash: generateEligibilityPolicyHash("T002", 10, 50, 5)
  };

  // Case 1: Tender 5/10/3 vs Vendor 8/25/7 -> ELIGIBLE
  it("Case 1: Should evaluate Vendor (8/25/7) as ELIGIBLE for Tender T001 (5/10/3)", function () {
    const vendorWitness = { experience: 8, turnover: 25, projects: 7 };
    const proofRes = generateEligibilityProof("T001", "VEN-001", vendorWitness, tenderT001Reqs);
    expect(proofRes.eligible).to.be.true;
    expect(proofRes.proofValid).to.be.true;

    const verifyRes = verifyEligibilityProof(proofRes.proof, proofRes.publicSignals, tenderT001Reqs);
    expect(verifyRes.verified).to.be.true;
    expect(verifyRes.eligible).to.be.true;
  });

  // Case 2: Tender 5/10/3 vs Vendor 3/25/7 -> NOT ELIGIBLE (insufficient experience)
  it("Case 2: Should evaluate Vendor (3/25/7) as NOT ELIGIBLE for Tender T001 (5/10/3)", function () {
    const vendorWitness = { experience: 3, turnover: 25, projects: 7 };
    const proofRes = generateEligibilityProof("T001", "VEN-001", vendorWitness, tenderT001Reqs);
    expect(proofRes.eligible).to.be.false;

    const verifyRes = verifyEligibilityProof(proofRes.proof, proofRes.publicSignals, tenderT001Reqs);
    expect(verifyRes.verified).to.be.false;
    expect(verifyRes.eligible).to.be.false;
  });

  // Case 3: Tender 5/10/3 vs Vendor 8/5/7 -> NOT ELIGIBLE (insufficient turnover)
  it("Case 3: Should evaluate Vendor (8/5/7) as NOT ELIGIBLE for Tender T001 (5/10/3)", function () {
    const vendorWitness = { experience: 8, turnover: 5, projects: 7 };
    const proofRes = generateEligibilityProof("T001", "VEN-001", vendorWitness, tenderT001Reqs);
    expect(proofRes.eligible).to.be.false;

    const verifyRes = verifyEligibilityProof(proofRes.proof, proofRes.publicSignals, tenderT001Reqs);
    expect(verifyRes.verified).to.be.false;
    expect(verifyRes.eligible).to.be.false;
  });

  // Case 4: Tender 5/10/3 vs Vendor 8/25/2 -> NOT ELIGIBLE (insufficient projects)
  it("Case 4: Should evaluate Vendor (8/25/2) as NOT ELIGIBLE for Tender T001 (5/10/3)", function () {
    const vendorWitness = { experience: 8, turnover: 25, projects: 2 };
    const proofRes = generateEligibilityProof("T001", "VEN-001", vendorWitness, tenderT001Reqs);
    expect(proofRes.eligible).to.be.false;

    const verifyRes = verifyEligibilityProof(proofRes.proof, proofRes.publicSignals, tenderT001Reqs);
    expect(verifyRes.verified).to.be.false;
    expect(verifyRes.eligible).to.be.false;
  });

  // Case 5: Exact Boundary Case: Tender 5/10/3 vs Vendor 5/10/3 -> ELIGIBLE
  it("Case 5: Exact Boundary Case - Vendor (5/10/3) MUST be ELIGIBLE for Tender T001 (5/10/3)", function () {
    const vendorWitness = { experience: 5, turnover: 10, projects: 3 };
    const proofRes = generateEligibilityProof("T001", "VEN-001", vendorWitness, tenderT001Reqs);
    expect(proofRes.eligible).to.be.true;
    expect(proofRes.proofValid).to.be.true;

    const verifyRes = verifyEligibilityProof(proofRes.proof, proofRes.publicSignals, tenderT001Reqs);
    expect(verifyRes.verified).to.be.true;
    expect(verifyRes.eligible).to.be.true;
  });

  // Case 6: Same Vendor evaluated against T001 (5/10/3) and T002 (10/50/5)
  it("Case 6: Same Vendor (8/25/7) must get different results depending on the target tender", function () {
    const vendorWitness = { experience: 8, turnover: 25, projects: 7 };

    // T001 Evaluation
    const proofT001 = generateEligibilityProof("T001", "VEN-001", vendorWitness, tenderT001Reqs);
    const verifyT001 = verifyEligibilityProof(proofT001.proof, proofT001.publicSignals, tenderT001Reqs);
    expect(verifyT001.eligible).to.be.true;

    // T002 Evaluation (requires 10 yrs, 50 Cr, 5 proj)
    const proofT002 = generateEligibilityProof("T002", "VEN-001", vendorWitness, tenderT002Reqs);
    const verifyT002 = verifyEligibilityProof(proofT002.proof, proofT002.publicSignals, tenderT002Reqs);
    expect(verifyT002.eligible).to.be.false;
  });

  // Case 7: Replay Attack - Valid proof generated for T001 used for T002 -> REJECTED
  it("Case 7: Proof generated for T001 MUST be REJECTED when submitted to T002 due to policyHash mismatch", function () {
    const vendorWitness = { experience: 8, turnover: 25, projects: 7 };
    const proofT001 = generateEligibilityProof("T001", "VEN-001", vendorWitness, tenderT001Reqs);

    // Attempting to verify T001 proof against T002 requirements
    const replayVerify = verifyEligibilityProof(proofT001.proof, proofT001.publicSignals, tenderT002Reqs);
    expect(replayVerify.verified).to.be.false;
    expect(replayVerify.eligible).to.be.false;
    expect(replayVerify.policyMatch).to.be.false;
  });

  // Case 8: Zero-Knowledge Privacy Guarantee - Private witness values must NOT be present in proof/publicSignals
  it("Case 8: Verification output must NOT reveal private vendor inputs (experience, turnover, projects)", function () {
    const vendorWitness = { experience: 8, turnover: 25, projects: 7 };
    const proofRes = generateEligibilityProof("T001", "VEN-001", vendorWitness, tenderT001Reqs);
    
    const publicSignalKeys = Object.keys(proofRes.publicSignals);
    expect(publicSignalKeys).to.not.include("experience");
    expect(publicSignalKeys).to.not.include("turnover");
    expect(publicSignalKeys).to.not.include("projects");

    const jsonStr = JSON.stringify(proofRes);
    expect(jsonStr).to.not.contain('"experience":8');
    expect(jsonStr).to.not.contain('"turnover":25');
    expect(jsonStr).to.not.contain('"projects":7');
  });

  // Case 9: Verifying eligibility through Verifiable Credential (VC) metadata binding
  it("Case 9: Verifying eligibility through Verifiable Credential (VC) must preserve VC metadata in publicSignals", function () {
    const vcWitness = { experience: 8, turnover: 25, projects: 7 };
    const vcSignals = {
      verifiedViaVc: true,
      credentialId: "VC-853591",
      issuer: "did:key:z6MkIssuer001GovTenderAuthority99812"
    };

    const proofRes = generateEligibilityProof("T001", "VEN-001", vcWitness, tenderT001Reqs, vcSignals);
    expect(proofRes.eligible).to.be.true;
    expect(proofRes.publicSignals.verifiedViaVc).to.be.true;
    expect(proofRes.publicSignals.credentialId).to.equal("VC-853591");

    const verifyRes = verifyEligibilityProof(proofRes.proof, proofRes.publicSignals, tenderT001Reqs);
    expect(verifyRes.verified).to.be.true;
    expect(verifyRes.eligible).to.be.true;
    expect(verifyRes.verifiedViaVc).to.be.true;
    expect(verifyRes.credentialId).to.equal("VC-853591");
  });

  // Case 10: Ineligible Verifiable Credential (VC) must be rejected by ZKP gate
  it("Case 10: Ineligible Verifiable Credential (VC) with insufficient turnover must be REJECTED", function () {
    const ineligibleVcWitness = { experience: 8, turnover: 5, projects: 7 }; // turnover 5 < min 10
    const vcSignals = {
      verifiedViaVc: true,
      credentialId: "VC-INELIGIBLE-009"
    };

    const proofRes = generateEligibilityProof("T001", "VEN-001", ineligibleVcWitness, tenderT001Reqs, vcSignals);
    expect(proofRes.eligible).to.be.false;
    expect(proofRes.proofValid).to.be.false;

    const verifyRes = verifyEligibilityProof(proofRes.proof, proofRes.publicSignals, tenderT001Reqs);
    expect(verifyRes.verified).to.be.false;
    expect(verifyRes.eligible).to.be.false;
  });

});

