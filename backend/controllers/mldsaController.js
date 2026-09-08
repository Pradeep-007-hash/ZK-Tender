const {
  getAuthorityPublicKeyHex,
  issueVendorCredential,
  verifyVendorCredential,
  issueTenderPolicy,
  verifyTenderPolicy
} = require("../services/mldsaService");

const VendorCredential = require("../models/VendorCredential");
const TenderPolicy = require("../models/TenderPolicy");

// 1. GET /api/pqc/mldsa/public-key — Get Authority ML-DSA-65 Public Key
exports.getAuthorityPublicKey = async (req, res) => {
  try {
    const publicKeyHex = getAuthorityPublicKeyHex();
    return res.status(200).json({
      success: true,
      algorithm: "ML-DSA-65",
      publicKey: publicKeyHex
    });
  } catch (error) {
    console.error("[ML-DSA PUBLIC KEY ERROR]", error);
    return res.status(500).json({ success: false, message: "Error fetching authority ML-DSA public key." });
  }
};

// 2. POST /api/credentials/issue — Issue & Sign Vendor Credential (AUTHORITY)
exports.issueCredential = async (req, res) => {
  try {
    const { vendorId, experience, turnover, projects, expiresInDays } = req.body;
    if (!vendorId) {
      return res.status(400).json({ success: false, message: "vendorId is required to issue vendor credential." });
    }

    const bundle = issueVendorCredential({
      vendorId,
      experience: experience !== undefined ? experience : 8,
      turnover: turnover !== undefined ? turnover : 25,
      projects: projects !== undefined ? projects : 7,
      expiresInDays: expiresInDays || 365
    });

    // Save/Update in MongoDB VendorCredential collection
    await VendorCredential.findOneAndUpdate(
      { vendorId },
      {
        credentialId: bundle.credential.credentialId,
        vendorId,
        credentialData: bundle.credential,
        issuer: bundle.credential.issuer,
        signature: bundle.signature,
        algorithm: "ML-DSA-65",
        status: "ACTIVE"
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(201).json({
      success: true,
      message: "Vendor Credential issued and signed with ML-DSA-65 successfully.",
      credentialBundle: {
        credential: bundle.credential,
        signature: bundle.signature,
        algorithm: "ML-DSA-65",
        authorityPublicKey: bundle.authorityPublicKey
      }
    });
  } catch (error) {
    console.error("[ML-DSA ISSUE CREDENTIAL ERROR]", error);
    return res.status(500).json({ success: false, message: "Server error issuing vendor credential." });
  }
};

// 3. GET /api/credentials/vendor/:vendorId — Retrieve signed Vendor Credential
exports.getVendorCredential = async (req, res) => {
  try {
    const { vendorId } = req.params;
    let record = await VendorCredential.findOne({ vendorId });

    if (!record) {
      // Auto-issue a default signed credential if not existing yet
      const bundle = issueVendorCredential({ vendorId, experience: 8, turnover: 25, projects: 7 });
      record = await VendorCredential.create({
        credentialId: bundle.credential.credentialId,
        vendorId,
        credentialData: bundle.credential,
        issuer: bundle.credential.issuer,
        signature: bundle.signature,
        algorithm: "ML-DSA-65",
        status: "ACTIVE"
      });
    }

    return res.status(200).json({
      success: true,
      credentialBundle: {
        credential: record.credentialData,
        signature: record.signature,
        algorithm: "ML-DSA-65",
        authorityPublicKey: getAuthorityPublicKeyHex()
      }
    });
  } catch (error) {
    console.error("[ML-DSA GET VENDOR CREDENTIAL ERROR]", error);
    return res.status(500).json({ success: false, message: "Error fetching signed vendor credential." });
  }
};

// 4. POST /api/credentials/verify — Verify Vendor Credential Signature & Binding
exports.verifyCredential = async (req, res) => {
  try {
    const { credentialBundle, vendorId } = req.body;
    const result = verifyVendorCredential(credentialBundle, vendorId);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: result.reason || "ML-DSA-65 Vendor Credential verification failed."
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: "ML-DSA-65 Vendor Credential signature and vendor binding verified successfully.",
      credential: result.credential
    });
  } catch (error) {
    console.error("[ML-DSA VERIFY CREDENTIAL ERROR]", error);
    return res.status(500).json({ success: false, message: "Server error verifying vendor credential signature." });
  }
};

// 5. POST /api/tenders/:tenderId/policy/sign — Issue & Sign Tender Policy (AUTHORITY)
exports.signTenderPolicy = async (req, res) => {
  try {
    const { tenderId } = req.params;
    const { minimumExperience, minimumTurnover, minimumProjects, policyVersion, expiresInDays } = req.body;

    const bundle = issueTenderPolicy({
      tenderId,
      minimumExperience: minimumExperience !== undefined ? minimumExperience : 5,
      minimumTurnover: minimumTurnover !== undefined ? minimumTurnover : 10,
      minimumProjects: minimumProjects !== undefined ? minimumProjects : 3,
      policyVersion: policyVersion || 1,
      expiresInDays: expiresInDays || 365
    });

    // Save/Update in MongoDB TenderPolicy collection
    await TenderPolicy.findOneAndUpdate(
      { tenderId },
      {
        tenderId,
        policyVersion: bundle.policy.policyVersion,
        policyData: bundle.policy,
        policyHash: bundle.policyHash,
        issuer: bundle.policy.issuer,
        signature: bundle.signature,
        algorithm: "ML-DSA-65",
        status: "ACTIVE"
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(201).json({
      success: true,
      message: "Tender Policy signed with ML-DSA-65 successfully.",
      policyBundle: {
        policy: bundle.policy,
        policyHash: bundle.policyHash,
        signature: bundle.signature,
        algorithm: "ML-DSA-65",
        authorityPublicKey: bundle.authorityPublicKey
      }
    });
  } catch (error) {
    console.error("[ML-DSA SIGN POLICY ERROR]", error);
    return res.status(500).json({ success: false, message: "Server error signing tender policy." });
  }
};

// 6. GET /api/tenders/:tenderId/policy — Retrieve signed Tender Policy
exports.getTenderPolicy = async (req, res) => {
  try {
    const { tenderId } = req.params;
    let record = await TenderPolicy.findOne({ tenderId });

    if (!record) {
      // Auto-issue & sign default tender policy if not created yet
      const bundle = issueTenderPolicy({ tenderId, minimumExperience: 5, minimumTurnover: 10, minimumProjects: 3 });
      record = await TenderPolicy.create({
        tenderId,
        policyVersion: bundle.policy.policyVersion,
        policyData: bundle.policy,
        policyHash: bundle.policyHash,
        issuer: bundle.policy.issuer,
        signature: bundle.signature,
        algorithm: "ML-DSA-65",
        status: "ACTIVE"
      });
    }

    return res.status(200).json({
      success: true,
      policyBundle: {
        policy: record.policyData,
        policyHash: record.policyHash,
        signature: record.signature,
        algorithm: "ML-DSA-65",
        authorityPublicKey: getAuthorityPublicKeyHex()
      }
    });
  } catch (error) {
    console.error("[ML-DSA GET TENDER POLICY ERROR]", error);
    return res.status(500).json({ success: false, message: "Error fetching signed tender policy." });
  }
};

// 7. POST /api/tenders/:tenderId/policy/verify — Verify Tender Policy Signature & Binding
exports.verifyPolicy = async (req, res) => {
  try {
    const { tenderId } = req.params;
    const { policyBundle } = req.body;
    const result = verifyTenderPolicy(policyBundle, tenderId);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: result.reason || "ML-DSA-65 Tender Policy verification failed."
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: "ML-DSA-65 Tender Policy signature and tender binding verified successfully.",
      policy: result.policy,
      policyHash: result.policyHash
    });
  } catch (error) {
    console.error("[ML-DSA VERIFY POLICY ERROR]", error);
    return res.status(500).json({ success: false, message: "Server error verifying tender policy signature." });
  }
};
