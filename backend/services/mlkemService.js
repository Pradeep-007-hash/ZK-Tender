const crypto = require("crypto");
const { ml_kem768 } = require("@noble/post-quantum/ml-kem.js");
const { bytesToHex, hexToBytes, deriveHkdfKey } = require("./pqcEncryptionService");

// Server-side ML-KEM-768 Key Pair
let serverKeyPair = null;

// Short-lived in-memory PQC Session Store: sessionId -> { sessionKey, createdAt, expiresAt }
const pqcSessions = new Map();

/**
 * Initializes or retrieves the server ML-KEM-768 key pair.
 * The private key remains strictly isolated in memory on the backend server.
 */
function initializeServerKeyPair() {
  if (!serverKeyPair) {
    serverKeyPair = ml_kem768.keygen();
    console.log("[ML-KEM-768 SERVICE] Generated server post-quantum key pair successfully.");
  }
  return serverKeyPair;
}

// Auto-initialize on module load
initializeServerKeyPair();

/**
 * Returns the server ML-KEM-768 public key in hex format.
 * (Does NOT expose the private key under any circumstances)
 */
function getServerPublicKeyHex() {
  const kp = initializeServerKeyPair();
  return bytesToHex(kp.publicKey);
}

/**
 * Decapsulates client ciphertext using the server ML-KEM-768 private key to obtain shared secret.
 */
function decapsulateSharedSecret(cipherTextHex) {
  const kp = initializeServerKeyPair();
  const cipherTextBytes = hexToBytes(cipherTextHex);
  const sharedSecretBytes = ml_kem768.decapsulate(cipherTextBytes, kp.secretKey);
  return sharedSecretBytes;
}

/**
 * Establishes a post-quantum session:
 * Decapsulates ML-KEM shared secret -> runs HKDF-SHA-256 -> stores short-lived AES session key
 */
function establishPqcSession(cipherTextHex) {
  const sharedSecret = decapsulateSharedSecret(cipherTextHex);
  
  // Derive 256-bit symmetric session key using HKDF-SHA-256
  const sessionKey = deriveHkdfKey(sharedSecret, null, "ZK-Tender-PQC-Session");
  
  const sessionId = "PQC-SESS-" + crypto.randomBytes(16).toString("hex").toUpperCase();
  const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes TTL

  pqcSessions.set(sessionId, {
    sessionKey,
    createdAt: new Date(),
    expiresAt
  });

  return {
    sessionId,
    established: true,
    expiresAt,
    algorithm: "ML-KEM-768"
  };
}

/**
 * Retrieves valid session key for an active PQC session
 */
function getPqcSessionKey(sessionId) {
  if (!sessionId || !pqcSessions.has(sessionId)) {
    return null;
  }
  const session = pqcSessions.get(sessionId);
  if (Date.now() > session.expiresAt) {
    pqcSessions.delete(sessionId);
    return null;
  }
  return session.sessionKey;
}

module.exports = {
  initializeServerKeyPair,
  getServerPublicKeyHex,
  decapsulateSharedSecret,
  establishPqcSession,
  getPqcSessionKey,
  pqcSessions
};
