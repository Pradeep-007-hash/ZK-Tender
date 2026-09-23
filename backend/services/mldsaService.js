const crypto = require("crypto");
const { ml_dsa65 } = require("@noble/post-quantum/ml-dsa.js");

// Authority ML-DSA-65 Key Pair
let authorityKeyPair = null;

function bytesToHex(bytes) {
  return Buffer.from(bytes).toString("hex");
}

function hexToBytes(hex) {
  const cleanHex = String(hex || "").replace(/^0x/i, "");
  return Buffer.from(cleanHex, "hex");
}

/**
 * Initializes or retrieves the Authority ML-DSA-65 Key Pair.
 * Private key remains strictly secret in server memory.
 */
function initializeAuthorityKeyPair() {
  if (!authorityKeyPair) {
    const seedString = process.env.ML_DSA_AUTHORITY_SEED || "ZK_TENDER_ML_DSA_65_AUTHORITY_SEED_SECRET_2026";
    const seedBytes = new Uint8Array(crypto.createHash("sha256").update(seedString).digest());
    authorityKeyPair = ml_dsa65.keygen(seedBytes);
    console.log("[ML-DSA-65 SERVICE] Generated Authority Post-Quantum Key Pair deterministically.");
  }
  return authorityKeyPair;
}

// Auto-initialize keypair on load
initializeAuthorityKeyPair();

/**
 * Returns the Authority ML-DSA-65 Public Key in hex format.
 */
function getAuthorityPublicKeyHex() {
  const kp = initializeAuthorityKeyPair();
  return bytesToHex(kp.publicKey);
}

/**
 * Recursively sorts object keys alphabetically to guarantee deterministic, canonical serialization.
 */
function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    // Exclude internal database / metadata keys from canonical signature input
    if (key === "_id" || key === "signature" || key === "__v") continue;
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  return sortedObj;
}

/**
 * Canonically serializes an object into a deterministic JSON string.
 */
function canonicalSerialize(obj) {
  const sortedObj = sortObjectKeys(obj);
  return JSON.stringify(sortedObj);
}

/**
 * Signs data object using Authority ML-DSA-65 private key.
 */
function signData(dataObj) {
  const kp = initializeAuthorityKeyPair();
  const canonicalStr = canonicalSerialize(dataObj);
  const msgBytes = Buffer.from(canonicalStr, "utf8");
  const sigBytes = ml_dsa65.sign(msgBytes, kp.secretKey);
  return bytesToHex(sigBytes);
}

/**
 * Verifies ML-DSA-65 signature against data object and public key.
 */
function verifyData(dataObj, signatureHex, publicKeyHex = null) {
  try {
    const pkBytes = publicKeyHex ? hexToBytes(publicKeyHex) : initializeAuthorityKeyPair().publicKey;
    const sigBytes = hexToBytes(signatureHex);
    const canonicalStr = canonicalSerialize(dataObj);
    const msgBytes = Buffer.from(canonicalStr, "utf8");

    return ml_dsa65.verify(sigBytes, msgBytes, pkBytes);
  } catch (err) {
    console.error("[ML-DSA-65 VERIFY ERROR]", err.message);
    return false;
  }
}

/**
 * Issues a signed Vendor Credential.
 */
function issueVendorCredential({
  vendorId = "VEN-001",
  experience = 8,
  turnover = 25,
  projects = 7,
  issuer = "AUTHORIZED_GOVERNMENT_AUTHORITY",
  expiresInDays = 365
}) {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  const credentialId = "VC-" + crypto.randomBytes(8).toString("hex").toUpperCase();

  const credential = {
    credentialId,
    vendorId,
    experience: Number(experience),
    turnover: Number(turnover),
    projects: Number(projects),
    issuer,
    issuedAt,
    expiresAt
  };

  const signature = signData(credential);

  return {
    credential,
    signature,
    algorithm: "ML-DSA-65",
    authorityPublicKey: getAuthorityPublicKeyHex()
  };
}

/**
 * Verifies a Vendor Credential bundle.
 */
function verifyVendorCredential(credentialBundle, expectedVendorId = null) {
  if (!credentialBundle || !credentialBundle.credential || !credentialBundle.signature) {
    return { valid: false, reason: "Missing credential object or ML-DSA signature" };
  }

  const { credential, signature, authorityPublicKey } = credentialBundle;

  // 1. ML-DSA-65 Cryptographic Signature Verification
  const isSigValid = verifyData(credential, signature, authorityPublicKey || getAuthorityPublicKeyHex());
  if (!isSigValid) {
    return { valid: false, reason: "ML-DSA-65 signature verification failed (data tampered or invalid signature)" };
  }

  // 2. Vendor Binding Verification
  if (expectedVendorId && credential.vendorId !== expectedVendorId) {
    return {
      valid: false,
      reason: `Vendor binding failure: Credential is bound to vendorId '${credential.vendorId}', but expected '${expectedVendorId}'`
    };
  }

  // 3. Expiration Verification
  if (credential.expiresAt && Date.now() > new Date(credential.expiresAt).getTime()) {
    return { valid: false, reason: "Vendor credential has expired" };
  }

  // 4. Issuer Check
  if (!credential.issuer) {
    return { valid: false, reason: "Invalid or missing credential issuer" };
  }

  return { valid: true, credential };
}

/**
 * Issues a signed Tender Policy and computes deterministic policyHash.
 */
function issueTenderPolicy({
  tenderId = "T001",
  minimumExperience = 5,
  minimumTurnover = 10,
  minimumProjects = 3,
  policyVersion = 1,
  issuer = "AUTHORIZED_GOVERNMENT_AUTHORITY",
  expiresInDays = 365
}) {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const policy = {
    tenderId,
    minimumExperience: Number(minimumExperience),
    minimumTurnover: Number(minimumTurnover),
    minimumProjects: Number(minimumProjects),
    policyVersion: Number(policyVersion),
    issuer,
    issuedAt,
    expiresAt
  };

  const canonicalStr = canonicalSerialize(policy);
  const policyHash = crypto.createHash("sha256").update(canonicalStr).digest("hex");
  const signature = signData(policy);

  return {
    policy,
    policyHash,
    signature,
    algorithm: "ML-DSA-65",
    authorityPublicKey: getAuthorityPublicKeyHex()
  };
}

/**
 * Verifies a Tender Policy bundle.
 */
function verifyTenderPolicy(policyBundle, expectedTenderId = null) {
  if (!policyBundle || !policyBundle.policy || !policyBundle.signature) {
    return { valid: false, reason: "Missing policy object or ML-DSA signature" };
  }

  const { policy, signature, authorityPublicKey } = policyBundle;

  // 1. ML-DSA-65 Cryptographic Signature Verification
  const isSigValid = verifyData(policy, signature, authorityPublicKey || getAuthorityPublicKeyHex());
  if (!isSigValid) {
    return { valid: false, reason: "ML-DSA-65 signature verification failed (tender policy tampered or invalid signature)" };
  }

  // 2. Tender Binding Verification
  if (expectedTenderId && policy.tenderId !== expectedTenderId) {
    return {
      valid: false,
      reason: `Tender binding failure: Policy is bound to tenderId '${policy.tenderId}', but expected '${expectedTenderId}'`
    };
  }

  // 3. Expiration Verification
  if (policy.expiresAt && Date.now() > new Date(policy.expiresAt).getTime()) {
    return { valid: false, reason: "Tender policy has expired" };
  }

  // Recompute canonical policyHash
  const canonicalStr = canonicalSerialize(policy);
  const policyHash = crypto.createHash("sha256").update(canonicalStr).digest("hex");

  return { valid: true, policy, policyHash };
}

module.exports = {
  initializeAuthorityKeyPair,
  getAuthorityPublicKeyHex,
  canonicalSerialize,
  signData,
  verifyData,
  issueVendorCredential,
  verifyVendorCredential,
  issueTenderPolicy,
  verifyTenderPolicy
};
