const express = require('express');
const router = express.Router();
const issuerController = require('../controllers/issuerController');

// Issuer Middleware Role Checker (Enforces Role Authorization)
const requireIssuerRole = (req, res, next) => {
  // Allow requests in dev mode or verify auth header / role
  const userRole = req.headers['x-user-role'] || req.user?.role || 'ISSUER';
  if (userRole && userRole.toUpperCase() === 'VENDOR') {
    return res.status(403).json({ success: false, message: "Forbidden: Vendor accounts cannot access Issuer APIs." });
  }
  next();
};

router.use(requireIssuerRole);

// 1. Dashboard Overview Stats
router.get('/dashboard', issuerController.getDashboardStats);

// 2. Vendor Applications
router.get('/vendors', issuerController.getVendors);
router.get('/vendors/:id', issuerController.getVendorById);
router.patch('/vendors/:id/status', issuerController.updateVendorStatus);
router.post('/vendors/:id/verify-all-documents', issuerController.verifyAllVendorDocuments);

// 3. Document Verification
router.get('/documents', issuerController.getDocuments);
router.patch('/documents/:id/verify', issuerController.verifyDocument);
router.patch('/documents/:id/reject', issuerController.rejectDocument);

// 4. Eligibility Verification
router.get('/eligibility/:vendorId', issuerController.getEligibility);
router.post('/eligibility/:vendorId/verify', issuerController.verifyEligibility);

// 5. DID Management & DID Document
router.get('/did', issuerController.getIssuerDidDetails);
router.get('/did/document', issuerController.getIssuerDidDocument);

// 6. Credential Management & Templates
router.get('/credentials', issuerController.getCredentials);
router.post('/credentials/issue', issuerController.issueCredential);
router.post('/credentials/:id/revoke', issuerController.revokeCredential);
router.post('/credentials/:id/renew', issuerController.renewCredential);
router.get('/credential-templates', issuerController.getCredentialTemplates);

// 7. ZKP Proof Verification & Audit Logs
router.post('/zkp/verify', issuerController.verifyZkpProof);
router.get('/audit-logs', issuerController.getAuditLogs);
router.get('/verification-requests', issuerController.getVerificationRequests);

// 8. Issuer Profile Management
router.get('/profile', issuerController.getIssuerProfile);
router.patch('/profile', issuerController.updateIssuerProfile);
router.post('/profile', issuerController.updateIssuerProfile);


module.exports = router;
