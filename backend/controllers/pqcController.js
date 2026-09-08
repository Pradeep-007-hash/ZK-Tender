const { getServerPublicKeyHex, establishPqcSession, getPqcSessionKey } = require("../services/mlkemService");
const { decryptAesGcm, encryptAesGcm } = require("../services/pqcEncryptionService");

// 1. GET /api/pqc/public-key — Expose server ML-KEM-768 public key
exports.getServerPublicKey = async (req, res) => {
  try {
    const publicKeyHex = getServerPublicKeyHex();
    return res.status(200).json({
      success: true,
      algorithm: "ML-KEM-768",
      publicKey: publicKeyHex
    });
  } catch (error) {
    console.error("[PQC GET PUBLIC KEY ERROR]", error);
    return res.status(500).json({ success: false, message: "Server error fetching post-quantum public key." });
  }
};

// 2. POST /api/pqc/session — Establish PQC Session from client ciphertext
exports.establishSession = async (req, res) => {
  try {
    const { cipherText } = req.body;
    if (!cipherText) {
      return res.status(400).json({ success: false, message: "ML-KEM ciphertext is required to establish session." });
    }

    const sessionRes = establishPqcSession(cipherText);

    // Return session details WITHOUT revealing shared secret or private keys
    return res.status(200).json({
      success: true,
      algorithm: "ML-KEM-768",
      sessionId: sessionRes.sessionId,
      established: sessionRes.established,
      expiresAt: sessionRes.expiresAt
    });
  } catch (error) {
    console.error("[PQC ESTABLISH SESSION ERROR]", error);
    return res.status(500).json({ success: false, message: "Error decapsulating ML-KEM ciphertext and establishing session." });
  }
};

// 3. POST /api/pqc/decrypt-payload — Decrypt PQC AES-256-GCM encrypted payload
exports.decryptPayload = async (req, res) => {
  try {
    const { sessionId, encryptedPayload } = req.body;
    if (!sessionId || !encryptedPayload) {
      return res.status(400).json({ success: false, message: "sessionId and encryptedPayload are required." });
    }

    const sessionKey = getPqcSessionKey(sessionId);
    if (!sessionKey) {
      return res.status(401).json({ success: false, message: "Invalid or expired PQC session. Please re-establish session." });
    }

    const decryptedData = decryptAesGcm(encryptedPayload, sessionKey);
    return res.status(200).json({
      success: true,
      payload: decryptedData
    });
  } catch (error) {
    console.error("[PQC DECRYPT PAYLOAD ERROR]", error.message);
    return res.status(400).json({ success: false, message: "Decryption failed: Payload authentication tag mismatch or invalid structure." });
  }
};
