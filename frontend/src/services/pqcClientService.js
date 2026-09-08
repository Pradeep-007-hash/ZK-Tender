import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';

// In-memory PQC Session Cache on Client
let activePqcSession = null;

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const cleanHex = String(hex || '').replace(/^0x/i, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Derives HKDF-SHA-256 key in browser using WebCrypto API
 */
async function deriveBrowserHkdfKey(sharedSecretBytes, saltBytes = new Uint8Array(32), infoStr = 'ZK-Tender-PQC-Session') {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const ikm = await window.crypto.subtle.importKey(
      'raw',
      sharedSecretBytes,
      'HKDF',
      false,
      ['deriveKey']
    );

    const encoder = new TextEncoder();
    const info = encoder.encode(infoStr);
    const salt = saltBytes || new Uint8Array(32);

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info
      },
      ikm,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  }
  throw new Error('WebCrypto API unavailable');
}

/**
 * Encrypts data using WebCrypto AES-GCM with a fresh 12-byte IV
 */
async function encryptWithCryptoKey(data, cryptoKey) {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintext
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  // Separate ciphertext and 16-byte auth tag (WebCrypto appends 16-byte tag at the end)
  const tagLength = 16;
  const ciphertextBytes = encryptedArray.slice(0, encryptedArray.length - tagLength);
  const tagBytes = encryptedArray.slice(encryptedArray.length - tagLength);

  return {
    ciphertext: bytesToHex(ciphertextBytes),
    iv: bytesToHex(iv),
    tag: bytesToHex(tagBytes),
    algorithm: 'AES-256-GCM'
  };
}

/**
 * Establishes a Post-Quantum ML-KEM-768 Session with the Backend
 */
export async function initializePqcSession() {
  try {
    // 1. Fetch Server ML-KEM-768 Public Key
    const pkRes = await fetch('http://localhost:5000/api/pqc/public-key');
    const pkData = await pkRes.json();
    if (!pkData.success || !pkData.publicKey) {
      throw new Error('Failed to fetch server ML-KEM public key');
    }

    const serverPublicKeyBytes = hexToBytes(pkData.publicKey);

    // 2. Client ML-KEM-768 Encapsulation
    const { cipherText, sharedSecret } = ml_kem768.encapsulate(serverPublicKeyBytes);
    const cipherTextHex = bytesToHex(cipherText);

    // 3. Post Ciphertext to Backend to establish server-side session
    const sessRes = await fetch('http://localhost:5000/api/pqc/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cipherText: cipherTextHex })
    });
    const sessData = await sessRes.json();
    if (!sessData.success || !sessData.sessionId) {
      throw new Error('Failed to establish PQC session on backend');
    }

    // 4. Derive matching HKDF-SHA-256 AES-GCM Key on Client
    const sessionCryptoKey = await deriveBrowserHkdfKey(sharedSecret);

    activePqcSession = {
      sessionId: sessData.sessionId,
      cryptoKey: sessionCryptoKey,
      algorithm: 'ML-KEM-768',
      establishedAt: new Date()
    };

    console.log(`[PQC CLIENT SERVICE] Established Post-Quantum ML-KEM-768 Session: ${sessData.sessionId}`);
    return activePqcSession;
  } catch (err) {
    console.error('[PQC CLIENT INITIALIZATION ERROR]', err.message);
    throw err;
  }
}

/**
 * Retrieves or auto-initializes the active PQC session
 */
export async function getActivePqcSession() {
  if (!activePqcSession) {
    return await initializePqcSession();
  }
  return activePqcSession;
}

/**
 * Encrypts sensitive vendor payload using the active PQC AES-256-GCM Session Key
 */
export async function encryptPqcPayload(data) {
  const session = await getActivePqcSession();
  const encryptedObj = await encryptWithCryptoKey(data, session.cryptoKey);

  return {
    sessionId: session.sessionId,
    algorithm: 'ML-KEM-768 + AES-256-GCM',
    encryptedPayload: encryptedObj
  };
}
