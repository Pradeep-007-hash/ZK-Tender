const express = require("express");
const router = express.Router();
const {
  getAuthorityPublicKey,
  issueCredential,
  getVendorCredential,
  verifyCredential,
  signTenderPolicy,
  getTenderPolicy,
  verifyPolicy
} = require("../controllers/mldsaController");

// ML-DSA-65 Public Key Endpoint
router.get("/pqc/mldsa/public-key", getAuthorityPublicKey);

// Vendor Credential Endpoints
router.post("/credentials/issue", issueCredential);
router.get("/credentials/vendor/:vendorId", getVendorCredential);
router.post("/credentials/verify", verifyCredential);

// Tender Policy Endpoints
router.post("/tenders/:tenderId/policy/sign", signTenderPolicy);
router.get("/tenders/:tenderId/policy", getTenderPolicy);
router.post("/tenders/:tenderId/policy/verify", verifyPolicy);

module.exports = router;
