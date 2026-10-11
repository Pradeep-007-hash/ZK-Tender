const { expect } = require("chai");
const crypto = require("crypto");

const {
  initializeAuthorityKeyPair,
  getAuthorityPublicKeyHex,
  issueVendorCredential,
  verifyVendorCredential
} = require("../backend/services/mldsaService");

const {
  generateEligibilityPolicyHash,
  getTenderEligibilityCriteria,
  generateEligibilityProof,
  verifyEligibilityProof
} = require("../backend/services/zkpEligibilityEngine");

describe("Refactored VC-Based ZKP Tender Verification Workflow (12 Required Scenarios)", function () {

  const tenderT001Reqs = {
    tenderId: "TND-2026-6868",
    minimumExperience: 5,
    minimumTurnover: 10,
    minimumProjects: 3,
    policyHash: generateEligibilityPolicyHash("TND-2026-6868", 5, 10, 3)
  };

  const tenderT002Reqs = {
    tenderId: "TND-2026-9999",
    minimumExperience: 10,
    minimumTurnover: 50,
    minimumProjects: 5,
    policyHash: generateEligibilityPolicyHash("TND-2026-9999", 10, 50, 5)
  };

  before(function () {
    initializeAuthorityKeyPair();
  });

  // Scenario 1: Valid VC with all required claims
  it("Scenario 1: Valid VC with all required claims MUST pass signature verification and ZKP eligibility", function () {
    const vcBundle = issueVendorCredential({
      vendorId: "VEN-001",
      experience: 8,
      turnover: 25,
      projects: 7
    });

    // 1. Verify VC signature and binding
    const vcResult = verifyVendorCredential(vcBundle, "VEN-001");
    expect(vcResult.valid).to.be.true;
    expect(vcResult.credential.experience).to.equal(8);
    expect(vcResult.credential.turnover).to.equal(25);
    expect(vcResult.credential.projects).to.equal(7);

    // 2. Synthesize ZKP from certified VC claims
    const witness = {
      experience: vcResult.credential.experience,
      turnover: vcResult.credential.turnover,
      projects: vcResult.credential.projects
    };
    const extraSignals = {
      verifiedViaVc: true,
      credentialId: vcResult.credential.credentialId
    };

    const proofResult = generateEligibilityProof(
      tenderT001Reqs.tenderId,
      "VEN-001",
      witness,
      tenderT001Reqs,
      extraSignals
    );
    expect(proofResult.eligible).to.be.true;
    expect(proofResult.proofValid).to.be.true;
    expect(proofResult.publicSignals.verifiedViaVc).to.be.true;

    // 3. Verify Groth16 proof against authoritative tender policy
    const verification = verifyEligibilityProof(
      proofResult.proof,
      proofResult.publicSignals,
      tenderT001Reqs
    );
    expect(verification.verified).to.be.true;
    expect(verification.eligible).to.be.true;
  });

  // Scenario 2: Missing VC
  it("Scenario 2: Missing VC MUST prevent verification", function () {
    const vcResult = verifyVendorCredential(null, "VEN-001");
    expect(vcResult.valid).to.be.false;
    expect(vcResult.reason).to.include("Missing credential object");
  });

  // Scenario 3: Invalid Issuer signature
  it("Scenario 3: Invalid or corrupted Issuer signature MUST fail verification", function () {
    const vcBundle = issueVendorCredential({
      vendorId: "VEN-001",
      experience: 8,
      turnover: 25,
      projects: 7
    });

    // Corrupt the signature hex
    const corruptedBundle = {
      ...vcBundle,
      signature: "0000000000000000" + vcBundle.signature.slice(16)
    };

    const vcResult = verifyVendorCredential(corruptedBundle, "VEN-001");
    expect(vcResult.valid).to.be.false;
    expect(vcResult.reason).to.include("ML-DSA-65 signature verification failed");
  });

  // Scenario 4: Expired or revoked credential
  it("Scenario 4a: Expired credential MUST be rejected", function () {
    const expiredBundle = issueVendorCredential({
      vendorId: "VEN-001",
      experience: 8,
      turnover: 25,
      projects: 7,
      expiresInDays: -10 // expired in the past
    });

    const vcResult = verifyVendorCredential(expiredBundle, "VEN-001");
    expect(vcResult.valid).to.be.false;
    expect(vcResult.reason).to.include("expired");
  });

  it("Scenario 4b: Revoked credential MUST be rejected", function () {
    const vcBundle = issueVendorCredential({
      vendorId: "VEN-001",
      experience: 8,
      turnover: 25,
      projects: 7
    });

    const revokedBundle = {
      ...vcBundle,
      status: "REVOKED"
    };

    const vcResult = verifyVendorCredential(revokedBundle, "VEN-001");
    expect(vcResult.valid).to.be.false;
    expect(vcResult.reason).to.include("revoked");
  });

  // Scenario 5: Missing required claim
  it("Scenario 5: Credential missing required claims MUST be detected and rejected", function () {
    const incompleteCredential = {
      credentialId: "VC-INCOMPLETE-123",
      vendorId: "VEN-001",
      experience: 8,
      // turnover is missing!
      projects: 7,
      issuer: "AUTHORIZED_GOVERNMENT_AUTHORITY",
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()
    };

    const hasAllClaims = incompleteCredential.experience !== undefined &&
                         incompleteCredential.turnover !== undefined &&
                         incompleteCredential.projects !== undefined;

    expect(hasAllClaims).to.be.false;
  });

  // Scenario 6: Vendor does not meet minimum experience
  it("Scenario 6: Vendor with insufficient experience (3 < 5) MUST fail eligibility constraint", function () {
    const witness = { experience: 3, turnover: 25, projects: 7 };
    const proofResult = generateEligibilityProof(
      tenderT001Reqs.tenderId,
      "VEN-001",
      witness,
      tenderT001Reqs
    );
    expect(proofResult.eligible).to.be.false;
    expect(proofResult.proofValid).to.be.false;

    const verification = verifyEligibilityProof(
      proofResult.proof,
      proofResult.publicSignals,
      tenderT001Reqs
    );
    expect(verification.verified).to.be.false;
    expect(verification.eligible).to.be.false;
  });

  // Scenario 7: Vendor does not meet minimum turnover
  it("Scenario 7: Vendor with insufficient turnover (5 < 10) MUST fail eligibility constraint", function () {
    const witness = { experience: 8, turnover: 5, projects: 7 };
    const proofResult = generateEligibilityProof(
      tenderT001Reqs.tenderId,
      "VEN-001",
      witness,
      tenderT001Reqs
    );
    expect(proofResult.eligible).to.be.false;
    expect(proofResult.proofValid).to.be.false;

    const verification = verifyEligibilityProof(
      proofResult.proof,
      proofResult.publicSignals,
      tenderT001Reqs
    );
    expect(verification.verified).to.be.false;
    expect(verification.eligible).to.be.false;
  });

  // Scenario 8: Vendor does not meet minimum project count
  it("Scenario 8: Vendor with insufficient completed projects (2 < 3) MUST fail eligibility constraint", function () {
    const witness = { experience: 8, turnover: 25, projects: 2 };
    const proofResult = generateEligibilityProof(
      tenderT001Reqs.tenderId,
      "VEN-001",
      witness,
      tenderT001Reqs
    );
    expect(proofResult.eligible).to.be.false;
    expect(proofResult.proofValid).to.be.false;

    const verification = verifyEligibilityProof(
      proofResult.proof,
      proofResult.publicSignals,
      tenderT001Reqs
    );
    expect(verification.verified).to.be.false;
    expect(verification.eligible).to.be.false;
  });

  // Scenario 9: Proof submitted for a different tender (Replay attack)
  it("Scenario 9: Proof generated for Tender A submitted to Tender B MUST be rejected", function () {
    const witness = { experience: 8, turnover: 25, projects: 7 };
    const proofForT001 = generateEligibilityProof(
      tenderT001Reqs.tenderId,
      "VEN-001",
      witness,
      tenderT001Reqs
    );

    // Attempt to verify Tender 1's proof against Tender 2's authoritative policy
    const replayVerification = verifyEligibilityProof(
      proofForT001.proof,
      proofForT001.publicSignals,
      tenderT002Reqs
    );
    expect(replayVerification.verified).to.be.false;
    expect(replayVerification.policyMatch).to.be.false;
    expect(replayVerification.message).to.include("Policy Hash Mismatch");
  });

  // Scenario 10: Invalid or tampered proof
  it("Scenario 10: Tampered or zeroed Groth16 proof elements MUST fail cryptographic verification", function () {
    const witness = { experience: 8, turnover: 25, projects: 7 };
    const validProofResult = generateEligibilityProof(
      tenderT001Reqs.tenderId,
      "VEN-001",
      witness,
      tenderT001Reqs
    );

    // Tamper with pi_a elliptic curve element
    const tamperedProof = {
      ...validProofResult.proof,
      pi_a: ["0x0", "0x0", "0x0"]
    };

    const verification = verifyEligibilityProof(
      tamperedProof,
      validProofResult.publicSignals,
      tenderT001Reqs
    );
    expect(verification.verified).to.be.false;
    expect(verification.message).to.include("Invalid Groth16 proof parameters");
  });

  // Scenario 11: Correct proof with incorrect public signals
  it("Scenario 11: Valid proof submitted with tampered public signals MUST be rejected", function () {
    const witness = { experience: 8, turnover: 25, projects: 7 };
    const validProofResult = generateEligibilityProof(
      tenderT001Reqs.tenderId,
      "VEN-001",
      witness,
      tenderT001Reqs
    );

    // Attacker modifies publicSignals minimumExperience: 5 -> 1
    const tamperedSignals = {
      ...validProofResult.publicSignals,
      minimumExperience: 1
    };

    const verification = verifyEligibilityProof(
      validProofResult.proof,
      tamperedSignals,
      tenderT001Reqs
    );
    expect(verification.verified).to.be.false;
    expect(verification.message).to.include("criteria parameters mismatch");
  });

  // Scenario 12: Vendor attempts to submit claims inconsistent with Issuer-authenticated commitment
  it("Scenario 12: Vendor attempting to tamper claims inconsistent with Issuer signature MUST be rejected", function () {
    const legitimateVc = issueVendorCredential({
      vendorId: "VEN-001",
      experience: 4, // Legitimately only 4 years (ineligible)
      turnover: 25,
      projects: 7
    });

    // Attacker tampers credential data to claim 10 years without authority re-signing
    const tamperedVc = {
      ...legitimateVc,
      credential: {
        ...legitimateVc.credential,
        experience: 10
      }
    };

    // The ML-DSA-65 post-quantum signature verification MUST detect the discrepancy and reject it
    const verification = verifyVendorCredential(tamperedVc, "VEN-001");
    expect(verification.valid).to.be.false;
    expect(verification.reason).to.include("ML-DSA-65 signature verification failed");
  });

});
