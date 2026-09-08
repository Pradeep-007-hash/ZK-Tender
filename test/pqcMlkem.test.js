const crypto = require("crypto");
const { expect } = require("chai");
const { ml_kem768 } = require("@noble/post-quantum/ml-kem.js");
const {
  initializeServerKeyPair,
  getServerPublicKeyHex,
  decapsulateSharedSecret,
  establishPqcSession,
  getPqcSessionKey
} = require("../backend/services/mlkemService");

const {
  bytesToHex,
  hexToBytes,
  deriveHkdfKey,
  encryptAesGcm,
  decryptAesGcm
} = require("../backend/services/pqcEncryptionService");

const {
  generateEligibilityPolicyHash,
  generateEligibilityProof,
  verifyEligibilityProof
} = require("../backend/services/zkpEligibilityEngine");

describe("Post-Quantum Cryptography (PQC) ML-KEM-768 & AES-256-GCM Layer", function () {

  // Test 1: Key Generation
  it("Test 1: Server ML-KEM-768 key pair generation", function () {
    const keyPair = initializeServerKeyPair();
    expect(keyPair).to.have.property("publicKey");
    expect(keyPair).to.have.property("secretKey");

    const publicKeyHex = getServerPublicKeyHex();
    expect(publicKeyHex).to.be.a("string");
    expect(publicKeyHex.length).to.be.greaterThan(100);
  });

  // Test 2: Encapsulation & Decapsulation (Client Secret == Server Secret)
  it("Test 2: Client ML-KEM-768 encapsulation and Server decapsulation MUST yield matching shared secret", function () {
    const serverPkHex = getServerPublicKeyHex();
    const serverPkBytes = hexToBytes(serverPkHex);

    // Client Encapsulation
    const { cipherText: clientCipherText, sharedSecret: clientSharedSecret } = ml_kem768.encapsulate(serverPkBytes);
    const clientCipherTextHex = bytesToHex(clientCipherText);
    const clientSharedSecretHex = bytesToHex(clientSharedSecret);

    // Server Decapsulation using Server Private Key
    const serverSharedSecretBytes = decapsulateSharedSecret(clientCipherTextHex);
    const serverSharedSecretHex = bytesToHex(serverSharedSecretBytes);

    expect(clientSharedSecretHex).to.equal(serverSharedSecretHex);
  });

  // Test 3: HKDF & AES-256-GCM Encryption / Decryption Roundtrip
  it("Test 3: Plaintext encrypted with HKDF derived AES-256-GCM key MUST decrypt back to original plaintext", function () {
    const rawSecret = Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "hex");
    const derivedKey = deriveHkdfKey(rawSecret, null, "ZK-Tender-PQC-Session");

    expect(derivedKey.length).to.equal(32); // 256 bits

    const sensitiveData = { experience: 8, turnover: 25, projects: 7, vendorSecret: "CONFIDENTIAL_REGISTRATION" };
    const encrypted = encryptAesGcm(sensitiveData, derivedKey);

    expect(encrypted).to.have.property("ciphertext");
    expect(encrypted).to.have.property("iv");
    expect(encrypted).to.have.property("tag");

    const decrypted = decryptAesGcm(encrypted, derivedKey);
    expect(decrypted).to.deep.equal(sensitiveData);
  });

  // Test 4: Tampering Detection (Authentication Failure)
  it("Test 4: Modifying ciphertext or authentication tag MUST fail AES-GCM decryption with an authentication error", function () {
    const rawSecret = Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "hex");
    const derivedKey = deriveHkdfKey(rawSecret, null, "ZK-Tender-PQC-Session");
    const encrypted = encryptAesGcm("Sensitive Financial Payload", derivedKey);

    // Tamper with ciphertext
    const tamperedCipher = {
      ...encrypted,
      ciphertext: encrypted.ciphertext.substring(0, encrypted.ciphertext.length - 2) + "00"
    };

    expect(() => decryptAesGcm(tamperedCipher, derivedKey)).to.throw(/Decryption failed|Unsupported state/i);

    // Tamper with tag
    const tamperedTag = {
      ...encrypted,
      tag: "00000000000000000000000000000000"
    };

    expect(() => decryptAesGcm(tamperedTag, derivedKey)).to.throw(/Decryption failed|Unsupported state/i);
  });

  // Test 5: Nonce Reuse Prevention
  it("Test 5: Successive encryption operations MUST generate fresh, unique 12-byte IVs", function () {
    const key = crypto.randomBytes(32);
    const enc1 = encryptAesGcm("Data Payload 1", key);
    const enc2 = encryptAesGcm("Data Payload 1", key);

    expect(enc1.iv).to.not.equal(enc2.iv);
    expect(enc1.ciphertext).to.not.equal(enc2.ciphertext);
  });

  // Test 6: Key Isolation & API Safety
  it("Test 6: PQC Session response MUST NOT leak server ML-KEM private key, raw shared secret, or AES session key", function () {
    const serverPkBytes = hexToBytes(getServerPublicKeyHex());
    const { cipherText } = ml_kem768.encapsulate(serverPkBytes);

    const sessionRes = establishPqcSession(bytesToHex(cipherText));

    const responseKeys = Object.keys(sessionRes);
    expect(responseKeys).to.not.include("secretKey");
    expect(responseKeys).to.not.include("privateKey");
    expect(responseKeys).to.not.include("sharedSecret");
    expect(responseKeys).to.not.include("sessionKey");

    const jsonStr = JSON.stringify(sessionRes);
    expect(jsonStr).to.not.contain("secretKey");
    expect(jsonStr).to.not.contain("privateKey");
  });

  // Test 7: Integration with ZKP Eligibility Flow
  it("Test 7: PQC ML-KEM session establishment -> PQC encrypted payload -> ZKP Groth16 eligibility verification roundtrip", function () {
    // Step A: Client encapsulates with Server Public Key
    const serverPkBytes = hexToBytes(getServerPublicKeyHex());
    const { cipherText: clientCipherText, sharedSecret: clientSharedSecret } = ml_kem768.encapsulate(serverPkBytes);

    // Step B: Backend decapsulates & establishes PQC Session
    const pqcSession = establishPqcSession(bytesToHex(clientCipherText));
    expect(pqcSession.established).to.be.true;

    // Step C: Client derives HKDF key & encrypts sensitive vendor witness payload
    const clientDerivedKey = deriveHkdfKey(clientSharedSecret, null, "ZK-Tender-PQC-Session");
    const vendorWitness = { experience: 8, turnover: 25, projects: 7 };
    const encryptedWitnessPayload = encryptAesGcm(vendorWitness, clientDerivedKey);

    // Step D: Server retrieves PQC session key & decrypts payload
    const serverSessionKey = getPqcSessionKey(pqcSession.sessionId);
    const serverDecryptedWitness = decryptAesGcm(encryptedWitnessPayload, serverSessionKey);
    expect(serverDecryptedWitness).to.deep.equal(vendorWitness);

    // Step E: Server runs existing Groth16 ZKP Eligibility verification engine
    const tenderReqs = {
      tenderId: "T001",
      minimumExperience: 5,
      minimumTurnover: 10,
      minimumProjects: 3,
      policyHash: generateEligibilityPolicyHash("T001", 5, 10, 3)
    };

    const proofRes = generateEligibilityProof("T001", "VEN-001", serverDecryptedWitness, tenderReqs);
    expect(proofRes.eligible).to.be.true;

    const verifyRes = verifyEligibilityProof(proofRes.proof, proofRes.publicSignals, tenderReqs);
    expect(verifyRes.verified).to.be.true;
    expect(verifyRes.eligible).to.be.true;
  });

});
