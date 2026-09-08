const crypto = require("crypto");
const { expect } = require("chai");
const { ml_dsa65 } = require("@noble/post-quantum/ml-dsa.js");

const {
  initializeAuthorityKeyPair,
  getAuthorityPublicKeyHex,
  canonicalSerialize,
  signData,
  verifyData,
  issueVendorCredential,
  verifyVendorCredential,
  issueTenderPolicy,
  verifyTenderPolicy
} = require("../backend/services/mldsaService");

const {
  generateEligibilityPolicyHash,
  generateEligibilityProof,
  verifyEligibilityProof
} = require("../backend/services/zkpEligibilityEngine");

describe("Post-Quantum Digital Signature Layer (ML-DSA-65)", function () {

  before(function () {
    initializeAuthorityKeyPair();
  });

  // TEST 1: Valid vendor credential -> ML-DSA verification succeeds
  it("TEST 1: Valid signed vendor credential MUST pass ML-DSA-65 signature verification", function () {
    const bundle = issueVendorCredential({
      vendorId: "VEN-001",
      experience: 8,
      turnover: 25,
      projects: 7
    });

    const result = verifyVendorCredential(bundle, "VEN-001");
    expect(result.valid).to.be.true;
    expect(result.credential.vendorId).to.equal("VEN-001");
  });

  // TEST 2: Modify experience 8 -> 50 -> Signature verification fails
  it("TEST 2: Modifying experience attribute in signed credential MUST cause ML-DSA verification to fail", function () {
    const bundle = issueVendorCredential({
      vendorId: "VEN-001",
      experience: 8,
      turnover: 25,
      projects: 7
    });

    // Attacker tampers experience: 8 -> 50
    const tamperedBundle = {
      ...bundle,
      credential: {
        ...bundle.credential,
        experience: 50
      }
    };

    const result = verifyVendorCredential(tamperedBundle, "VEN-001");
    expect(result.valid).to.be.false;
    expect(result.reason).to.include("signature verification failed");
  });

  // TEST 3: Modify turnover 25 -> 500 -> Signature verification fails
  it("TEST 3: Modifying turnover attribute in signed credential MUST cause ML-DSA verification to fail", function () {
    const bundle = issueVendorCredential({
      vendorId: "VEN-001",
      experience: 8,
      turnover: 25,
      projects: 7
    });

    // Attacker tampers turnover: 25 -> 500
    const tamperedBundle = {
      ...bundle,
      credential: {
        ...bundle.credential,
        turnover: 500
      }
    };

    const result = verifyVendorCredential(tamperedBundle, "VEN-001");
    expect(result.valid).to.be.false;
    expect(result.reason).to.include("signature verification failed");
  });

  // TEST 4: Use another vendor's credential -> Credential binding fails
  it("TEST 4: Attempting to use Vendor A's credential for Vendor B MUST fail vendor binding check", function () {
    const vendorABundle = issueVendorCredential({
      vendorId: "VENDOR_A",
      experience: 12,
      turnover: 50,
      projects: 10
    });

    // Vendor B submits Vendor A's valid credential
    const result = verifyVendorCredential(vendorABundle, "VENDOR_B");
    expect(result.valid).to.be.false;
    expect(result.reason).to.include("Vendor binding failure");
  });

  // TEST 5: Modify tender minimum experience 5 -> 1 -> Policy signature verification fails
  it("TEST 5: Modifying tender minimum experience in policy MUST cause ML-DSA verification to fail", function () {
    const policyBundle = issueTenderPolicy({
      tenderId: "T001",
      minimumExperience: 5,
      minimumTurnover: 10,
      minimumProjects: 3
    });

    // Attacker lowers requirement: 5 -> 1
    const tamperedPolicyBundle = {
      ...policyBundle,
      policy: {
        ...policyBundle.policy,
        minimumExperience: 1
      }
    };

    const result = verifyTenderPolicy(tamperedPolicyBundle, "T001");
    expect(result.valid).to.be.false;
    expect(result.reason).to.include("signature verification failed");
  });

  // TEST 6: Use T001 policy for T002 -> Tender binding fails
  it("TEST 6: Attempting to use Tender T001 policy for Tender T002 MUST fail tender binding check", function () {
    const policyBundleT001 = issueTenderPolicy({
      tenderId: "T001",
      minimumExperience: 5,
      minimumTurnover: 10,
      minimumProjects: 3
    });

    // Submitting T001 policy when verifying T002
    const result = verifyTenderPolicy(policyBundleT001, "T002");
    expect(result.valid).to.be.false;
    expect(result.reason).to.include("Tender binding failure");
  });

  // TEST 7: Expired credential -> Reject
  it("TEST 7: Expired vendor credential MUST be rejected", function () {
    const expiredBundle = issueVendorCredential({
      vendorId: "VEN-001",
      experience: 8,
      turnover: 25,
      projects: 7,
      expiresInDays: -1 // Expired yesterday
    });

    const result = verifyVendorCredential(expiredBundle, "VEN-001");
    expect(result.valid).to.be.false;
    expect(result.reason).to.include("expired");
  });

  // TEST 8: Expired policy -> Reject
  it("TEST 8: Expired tender policy MUST be rejected", function () {
    const expiredPolicyBundle = issueTenderPolicy({
      tenderId: "T001",
      minimumExperience: 5,
      minimumTurnover: 10,
      minimumProjects: 3,
      expiresInDays: -1 // Expired yesterday
    });

    const result = verifyTenderPolicy(expiredPolicyBundle, "T001");
    expect(result.valid).to.be.false;
    expect(result.reason).to.include("expired");
  });

  // TEST 9: Invalid issuer -> Reject
  it("TEST 9: Credential with missing or invalid issuer MUST be rejected", function () {
    const bundle = issueVendorCredential({ vendorId: "VEN-001" });
    const noIssuerBundle = {
      ...bundle,
      credential: {
        ...bundle.credential,
        issuer: ""
      }
    };

    const result = verifyVendorCredential(noIssuerBundle, "VEN-001");
    expect(result.valid).to.be.false;
  });

  // TEST 10: Invalid ML-DSA signature -> Reject
  it("TEST 10: Credential with corrupted or invalid ML-DSA signature MUST be rejected", function () {
    const bundle = issueVendorCredential({ vendorId: "VEN-001" });
    const corruptedSigBundle = {
      ...bundle,
      signature: bundle.signature.substring(0, bundle.signature.length - 8) + "00000000"
    };

    const result = verifyVendorCredential(corruptedSigBundle, "VEN-001");
    expect(result.valid).to.be.false;
    expect(result.reason).to.include("signature verification failed");
  });

  // TEST 11: Valid signed credential + valid signed policy + valid ZKP -> Eligibility Verified
  it("TEST 11: Valid ML-DSA signed credential + valid ML-DSA signed policy + valid ZKP proof MUST yield ELIGIBILITY VERIFIED", function () {
    // 1. Issue & verify Vendor Credential
    const vcBundle = issueVendorCredential({ vendorId: "VEN-001", experience: 8, turnover: 25, projects: 7 });
    const vcResult = verifyVendorCredential(vcBundle, "VEN-001");
    expect(vcResult.valid).to.be.true;

    // 2. Issue & verify Tender Policy
    const tpBundle = issueTenderPolicy({ tenderId: "T001", minimumExperience: 5, minimumTurnover: 10, minimumProjects: 3 });
    const tpResult = verifyTenderPolicy(tpBundle, "T001");
    expect(tpResult.valid).to.be.true;

    // 3. Construct ZKP Policy Requirements using verified ML-DSA policy
    const tenderReqs = {
      tenderId: tpResult.policy.tenderId,
      minimumExperience: tpResult.policy.minimumExperience,
      minimumTurnover: tpResult.policy.minimumTurnover,
      minimumProjects: tpResult.policy.minimumProjects,
      policyHash: tpResult.policyHash
    };

    // 4. Generate & Verify Groth16 ZKP Proof
    const witness = {
      experience: vcResult.credential.experience,
      turnover: vcResult.credential.turnover,
      projects: vcResult.credential.projects
    };

    const proofRes = generateEligibilityProof("T001", "VEN-001", witness, tenderReqs);
    expect(proofRes.eligible).to.be.true;

    const verifyRes = verifyEligibilityProof(proofRes.proof, proofRes.publicSignals, tenderReqs);
    expect(verifyRes.verified).to.be.true;
    expect(verifyRes.eligible).to.be.true;
  });

  // TEST 12: Valid ML-DSA signatures but invalid ZKP -> Eligibility Rejected
  it("TEST 12: Valid ML-DSA signatures but failing eligibility numbers MUST yield ELIGIBILITY REJECTED", function () {
    // 1. Issue & verify Vendor Credential with insufficient numbers (experience: 3 < 5)
    const vcBundle = issueVendorCredential({ vendorId: "VEN-INELIGIBLE", experience: 3, turnover: 25, projects: 7 });
    const vcResult = verifyVendorCredential(vcBundle, "VEN-INELIGIBLE");
    expect(vcResult.valid).to.be.true;

    // 2. Issue & verify Tender Policy
    const tpBundle = issueTenderPolicy({ tenderId: "T001", minimumExperience: 5, minimumTurnover: 10, minimumProjects: 3 });
    const tpResult = verifyTenderPolicy(tpBundle, "T001");
    expect(tpResult.valid).to.be.true;

    const tenderReqs = {
      tenderId: tpResult.policy.tenderId,
      minimumExperience: tpResult.policy.minimumExperience,
      minimumTurnover: tpResult.policy.minimumTurnover,
      minimumProjects: tpResult.policy.minimumProjects,
      policyHash: tpResult.policyHash
    };

    const witness = {
      experience: vcResult.credential.experience,
      turnover: vcResult.credential.turnover,
      projects: vcResult.credential.projects
    };

    // Groth16 proof generation evaluates eligible === 0
    const proofRes = generateEligibilityProof("T001", "VEN-INELIGIBLE", witness, tenderReqs);
    expect(proofRes.eligible).to.be.false;

    const verifyRes = verifyEligibilityProof(proofRes.proof, proofRes.publicSignals, tenderReqs);
    expect(verifyRes.eligible).to.be.false;
  });

});
