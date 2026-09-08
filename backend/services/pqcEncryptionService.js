const crypto = require("crypto");

/**
 * Converts Uint8Array or Buffer to hex string
 */
function bytesToHex(bytes) {
  return Buffer.from(bytes).toString("hex");
}

/**
 * Converts hex string to Buffer
 */
function hexToBytes(hex) {
  const cleanHex = String(hex || "").replace(/^0x/i, "");
  return Buffer.from(cleanHex, "hex");
}

/**
 * Derives a 256-bit symmetric encryption key from a shared secret using HKDF-SHA-256
 */
function deriveHkdfKey(sharedSecret, salt = null, info = "ZK-Tender-PQC-Session") {
  const secretBuffer = typeof sharedSecret === "string" ? hexToBytes(sharedSecret) : Buffer.from(sharedSecret);
  const saltBuffer = salt ? (typeof salt === "string" ? hexToBytes(salt) : Buffer.from(salt)) : Buffer.alloc(32, 0);
  const infoBuffer = Buffer.from(info, "utf8");

  // HKDF-SHA-256 key expansion to 32 bytes (256 bits)
  const derivedKey = crypto.hkdfSync("sha256", secretBuffer, saltBuffer, infoBuffer, 32);
  return Buffer.from(derivedKey);
}

/**
 * Encrypts data object or string using AES-256-GCM with a fresh random 12-byte IV
 */
function encryptAesGcm(data, keyBuffer) {
  if (!data) throw new Error("Encryption failed: Plaintext data is required");
  if (!keyBuffer || keyBuffer.length !== 32) throw new Error("Encryption failed: 256-bit key required");

  const plaintext = typeof data === "string" ? data : JSON.stringify(data);
  
  // Fresh 12-byte cryptographically secure random IV for every encryption operation
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    tag: authTag.toString("hex"),
    algorithm: "AES-256-GCM"
  };
}

/**
 * Decrypts AES-256-GCM payload and verifies authentication tag
 */
function decryptAesGcm(encryptedPayload, keyBuffer) {
  if (!encryptedPayload || !encryptedPayload.ciphertext || !encryptedPayload.iv || !encryptedPayload.tag) {
    throw new Error("Decryption failed: Missing ciphertext, IV, or authentication tag");
  }
  if (!keyBuffer || keyBuffer.length !== 32) throw new Error("Decryption failed: 256-bit key required");

  const iv = Buffer.from(encryptedPayload.iv, "hex");
  const tag = Buffer.from(encryptedPayload.tag, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
  
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedPayload.ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  try {
    return JSON.parse(decrypted);
  } catch (e) {
    return decrypted;
  }
}

module.exports = {
  bytesToHex,
  hexToBytes,
  deriveHkdfKey,
  encryptAesGcm,
  decryptAesGcm
};
