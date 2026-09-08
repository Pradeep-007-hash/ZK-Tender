const express = require("express");
const router = express.Router();
const { getServerPublicKey, establishSession, decryptPayload } = require("../controllers/pqcController");

// PQC ML-KEM-768 & AES-256-GCM Endpoints
router.get("/public-key", getServerPublicKey);
router.post("/session", establishSession);
router.post("/decrypt-payload", decryptPayload);

module.exports = router;
