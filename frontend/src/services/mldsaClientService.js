import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

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
 * Deterministically sorts keys recursively for canonical JSON serialization
 */
function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    if (key === '_id' || key === 'signature' || key === '__v') continue;
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  return sortedObj;
}

export function canonicalSerialize(obj) {
  return JSON.stringify(sortObjectKeys(obj));
}

/**
 * Client-side ML-DSA-65 signature verification
 */
export function verifyMldsaSignature(dataObj, signatureHex, publicKeyHex) {
  try {
    const canonicalStr = canonicalSerialize(dataObj);
    const encoder = new TextEncoder();
    const msgBytes = encoder.encode(canonicalStr);
    const sigBytes = hexToBytes(signatureHex);
    const pkBytes = hexToBytes(publicKeyHex);

    return ml_dsa65.verify(sigBytes, msgBytes, pkBytes);
  } catch (err) {
    console.error('[ML-DSA CLIENT VERIFY ERROR]', err.message);
    return false;
  }
}

/**
 * Fetches authority ML-DSA-65 public key
 */
export async function fetchAuthorityPublicKey() {
  const res = await fetch('http://localhost:5000/api/pqc/mldsa/public-key');
  const data = await res.json();
  if (!data.success || !data.publicKey) {
    throw new Error('Failed to fetch Authority ML-DSA public key');
  }
  return data.publicKey;
}

/**
 * Fetches and verifies signed Vendor Credential
 */
export async function getVerifiedVendorCredential(vendorId) {
  const res = await fetch(`http://localhost:5000/api/credentials/vendor/${vendorId}`);
  const data = await res.json();
  if (!data.success || !data.credentialBundle) {
    throw new Error('Failed to fetch Vendor Credential bundle');
  }

  const { credential, signature, authorityPublicKey } = data.credentialBundle;

  // 1. ML-DSA-65 Signature Check
  const validSig = verifyMldsaSignature(credential, signature, authorityPublicKey);
  if (!validSig) {
    throw new Error('ML-DSA-65 Vendor Credential Signature Verification Failed (data tampered or invalid signature)');
  }

  // 2. Vendor Binding Check
  if (vendorId && credential.vendorId !== vendorId) {
    throw new Error(`Vendor Binding Mismatch: Credential bound to ${credential.vendorId}, requested ${vendorId}`);
  }

  return {
    verified: true,
    credentialBundle: data.credentialBundle
  };
}

/**
 * Fetches and verifies signed Tender Policy
 */
export async function getVerifiedTenderPolicy(tenderId) {
  const res = await fetch(`http://localhost:5000/api/tenders/${tenderId}/policy`);
  const data = await res.json();
  if (!data.success || !data.policyBundle) {
    throw new Error('Failed to fetch Tender Policy bundle');
  }

  const { policy, signature, authorityPublicKey } = data.policyBundle;

  // 1. ML-DSA-65 Signature Check
  const validSig = verifyMldsaSignature(policy, signature, authorityPublicKey);
  if (!validSig) {
    throw new Error('ML-DSA-65 Tender Policy Signature Verification Failed (policy tampered or invalid signature)');
  }

  // 2. Tender Binding Check
  if (tenderId && policy.tenderId !== tenderId) {
    throw new Error(`Tender Policy Binding Mismatch: Policy bound to ${policy.tenderId}, requested ${tenderId}`);
  }

  return {
    verified: true,
    policyBundle: data.policyBundle
  };
}
