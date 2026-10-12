# 🛡️ ZK-Tender: Quantum-Safe Zero-Knowledge E-Procurement Platform

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-v2.29-yellow?logo=ethereum&logoColor=black)](https://hardhat.org/)
[![Circom & SnarkJS](https://img.shields.io/badge/ZKP-Circom%202.0%20%7C%20Groth16-orange)](https://iden3.io/circom)
[![Post-Quantum Cryptography](https://img.shields.io/badge/NIST%20PQC-ML--KEM--768%20%7C%20ML--DSA--65-blueviolet)](https://csrc.nist.gov/projects/post-quantum-cryptography)
[![W3C DID & VC](https://img.shields.io/badge/Identity-W3C%20DID%20%7C%20Verifiable%20Credentials-008080)](https://www.w3.org/TR/did-core/)
[![React 18 & Vite](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%205-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js & Express](https://img.shields.io/badge/Backend-Express%205%20%7C%20Node.js-339933?logo=node.js&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/Tests-73%20Passing-brightgreen?logo=mocha&logoColor=white)](#-testing-suite)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [The Problem We Solve](#-the-problem-we-solve)
- [The Five Core Pillars](#-the-five-core-pillars)
- [System Architecture](#-system-architecture)
- [End-to-End Workflow](#-end-to-end-workflow)
- [User Roles & Dedicated Portals](#-user-roles--dedicated-portals)
- [Evaluation Model: AHP + Min-Max + WSM](#-evaluation-model-ahp--min-max--wsm)
- [Technology Stack](#-technology-stack)
- [Repository Directory Structure](#-repository-directory-structure)
- [Prerequisites & Requirements](#-prerequisites--requirements)
- [Initial Setup & Installation Guide](#-initial-setup--installation-guide)
- [Environment Variables Configuration](#-environment-variables-configuration)
- [Pre-Seeded System Credentials](#-pre-seeded-system-credentials)
- [Testing Suite](#-testing-suite)
- [API Reference](#-api-reference)
- [Smart Contract Deployment](#-smart-contract-deployment)
- [Security & Quantum-Safety Guarantees](#-security--quantum-safety-guarantees)
- [Contributing & License](#-contributing--license)

---

## 📖 Overview

**ZK-Tender** is a next-generation, quantum-resilient, privacy-preserving e-procurement platform designed to eliminate corruption, bid leakage, commercial espionage, and insider favoritism from public and enterprise procurement.

By combining **Zero-Knowledge Proofs (zk-SNARKs via Circom/Groth16)**, **Post-Quantum Cryptography (NIST Standardized ML-KEM-768 & ML-DSA-65)**, **W3C Decentralized Identifiers (DID) & Verifiable Credentials (VC)**, and **Ethereum Smart Contracts**, ZK-Tender allows vendors to prove strict regulatory and technical eligibility *without disclosing sensitive financials or trade secrets*, submits cryptographically sealed bids that no authority or attacker can open prior to the deadline, and performs mathematical, tamper-proof multi-criteria bid evaluation.

---

## 🚨 The Problem We Solve

Traditional procurement systems (e.g., legacy government tender portals, centralized ERPs) suffer from major systemic vulnerabilities:

| Traditional Procurement Risk | How ZK-Tender Solves It |
|---|---|
| **Insider Bid Leakage & Front-Running:** Corrupt officers or sysadmins access confidential bid prices before closing, tipping off favoured bidders. | **Post-Quantum Sealed-Bid Encapsulation:** Bids are encapsulated with ML-KEM-768 and locked on-chain. Decapsulation keys cannot be activated until the deadline expires. |
| **Exposure of Proprietary Metrics:** Vendors must reveal their exact annual turnover, project histories, and margins, compromising trade secrets. | **Zero-Knowledge Range Proofs:** Vendors prove via zk-SNARKs that $\text{Turnover} \ge \text{Min}$ and $\text{Experience} \ge \text{Min}$ without disclosing exact figures. |
| **"Harvest Now, Decrypt Later" (HNDL):** Attackers record encrypted government bids today to decrypt them when quantum computers break RSA/ECC. | **NIST Post-Quantum Cryptography:** All ciphertexts and signatures utilize lattice-based cryptography (ML-KEM-768 / Kyber and ML-DSA-65 / Dilithium). |
| **Sybil Bids & Bogus Credentials:** Fly-by-night contractors submit forged balance sheets and experience certificates. | **W3C Verifiable Credentials:** Government Credential Issuers cryptographically sign digital credentials with verifiable DID chains. |
| **Subjective & Manipulated Scoring:** Procurement committees manually fiddle with evaluation criteria to award contracts to preferred cronies. | **Algorithmic AHP + Min-Max + WSM:** Pure mathematical evaluation engine executes pairwise AHP weighting, Min-Max normalization, and automated ranking. |

---

## 🏛️ The Five Core Pillars

```
                                      ┌────────────────────────────────────────┐
                                      │               ZK-TENDER                │
                                      │     Quantum-Safe E-Procurement         │
                                      └──────────────────┬─────────────────────┘
                                                         │
         ┌───────────────────┬───────────────────────────┼───────────────────────────┬───────────────────┐
         ▼                   ▼                           ▼                           ▼                   ▼
  ┌─────────────┐     ┌─────────────┐             ┌─────────────┐             ┌─────────────┐     ┌─────────────┐
  │  ZKP Proofs │     │ Post-Quantum│             │ W3C DID & VC│             │  Blockchain │     │  AHP-WSM    │
  │  (Circom /  │     │   (ML-KEM / │             │ Decentralized│            │   Ethereum  │     │ Algorithmic │
  │   Groth16)  │     │   ML-DSA)   │             │  Identity   │             │   Registry  │     │  Evaluation │
  └─────────────┘     └─────────────┘             └─────────────┘             └─────────────┘     └─────────────┘
```

### 1. 🛡️ Zero-Knowledge Proofs (zk-SNARKs with Circom & Groth16)
Vendors generate cryptographic proofs using `circuits/eligibility.circom`. The circuit takes **private witness inputs** (Vendor experience, annual turnover, completed projects) and **public signals** (tender minimum thresholds and policy hash). It produces a 256-bit Groth16 proof demonstrating that the vendor satisfies all criteria without revealing their actual numbers.

### 2. ⚛️ Post-Quantum Cryptography (NIST Standardized FIPS 203 & 204)
Implemented using `@noble/post-quantum`:
- **ML-KEM-768 (Kyber):** Quantum-safe lattice Key Encapsulation Mechanism used to establish ephemeral symmetric AES-256-GCM session keys for bid payload encryption.
- **ML-DSA-65 (Dilithium3):** Lattice-based digital signature algorithm ensuring non-repudiation, tamper detection, and post-quantum authenticity for tender policies, officer sanctions, and vendor submissions.

### 3. 🆔 W3C Decentralized Identifiers & Verifiable Credentials
- Integrates DID resolution (`did:ethr` / `did:key`) backed by Ethereum wallet challenge-response signing.
- Authorized government credential issuers issue cryptographically signed Verifiable Credentials (VCs) directly to vendor identity wallets.

### 4. ⛓️ Blockchain Integrity Layer (`TenderRegistry.sol`)
An immutable smart contract deployed on the Ethereum blockchain (Sepolia Testnet / Hardhat EVM). The contract anchors:
- Tender metadata & state machine (`Draft` $\rightarrow$ `Published` $\rightarrow$ `Open` $\rightarrow$ `Closed` $\rightarrow$ `UnderEvaluation` $\rightarrow$ `Awarded`).
- Cryptographic Keccak-256 hashes of tender specifications, eligibility criteria, scope, and evaluation matrices.
- On-chain sealed-bid commitment hashes, ensuring zero tampering after publication.

### 5. 📊 Multi-Criteria Decision Making (AHP + Min-Max + WSM)
An automated, unbiased decision engine:
- **Analytic Hierarchy Process (AHP):** Derives mathematically verified weights from pairwise criteria comparisons (with consistency ratio check $CR < 0.10$).
- **Min-Max Normalization:** Standardizes multi-dimensional criteria (cost vs. benefit).
- **Weighted Sum Model (WSM):** Synthesizes composite scores and deterministically outputs the winner and transparent vendor rankings.

---

## 🔄 System Architecture

```mermaid
graph TD
    subgraph "Frontend Layer (React 18 + Vite 5)"
        UI[Responsive SPA Portal]
        WC[Web3 Wallet Connect]
        ZKP_C[SnarkJS Client Engine]
        PQC_C[ML-KEM & ML-DSA Client]
    end

    subgraph "Backend API Gateway (Express 5 & Node.js)"
        API[RESTful API Controllers]
        AUTH[Auth & Google OAuth2]
        NOTIF[Nodemailer / Gmail SMTP]
        PQC_S[PQC Service: ML-KEM-768 & ML-DSA-65]
        ZKP_S[ZKP Engine: Groth16 Verifier]
        EVAL[AHP + Min-Max + WSM Engine]
    end

    subgraph "Off-Chain Storage (MongoDB Atlas)"
        DB[(MongoDB Atlas Collections)]
        TENDERS[Tenders & Policies]
        USERS[Users & DID Documents]
        VCS[Verifiable Credentials]
        BIDS[Encrypted Sealed Bids]
    end

    subgraph "Decentralized Ledger (Ethereum / Sepolia)"
        SC[TenderRegistry.sol]
        ANCHOR[Tender Metadata Hashes & State]
        EVENTS[TenderCreated & Status Events]
    end

    UI --> API
    WC --> SC
    ZKP_C --> API
    PQC_C --> API
    API --> DB
    API --> SC
    API --> NOTIF
```

---

## ⚡ End-to-End Workflow

```
1. AUTHORITY CREATES TENDER
   Officer defines specs, criteria & AHP weights
             │
             ▼
2. BLOCKCHAIN ANCHORING
   Keccak-256 hashes of scope & criteria anchored to TenderRegistry.sol
             │
             ▼
3. VENDOR CREDENTIAL ISSUANCE
   Government Credential Issuer issues cryptographically signed W3C VC
             │
             ▼
4. ZERO-KNOWLEDGE ELIGIBILITY PROOF
   Vendor compiles private witness; Circom/Groth16 generates ZK proof
             │
             ▼
5. QUANTUM-SAFE SEALED BIDDING
   Bid encrypted via ML-KEM-768; signed with ML-DSA-65 & submitted
             │
             ▼
6. DEADLINE EXPIRES & DECAPSULATION
   Authority triggers opening; bids decapsulated and verified
             │
             ▼
7. MATHEMATICAL AHP-WSM EVALUATION
   Criteria normalized; composite scores calculated; winner selected
             │
             ▼
8. CONTRACT AWARD & IMMUTABLE AUDIT
   Result anchored to blockchain; automated email notifications dispatched
```

---

## 👥 User Roles & Dedicated Portals

### 1. 🏛️ Procurement Authority Portal (`AUTHORITY`)
- **Tender Creation:** Multi-step wizard covering scope, financial limits, EMD, and Groth16 ZKP eligibility rules.
- **On-Chain Publication:** Automatically commits tender hashes directly to the Ethereum smart contract.
- **Tender Management:** Real-time dashboard showing active, closing soon, and awarded tenders.
- **Evaluation Detail:** Execute automated AHP matrix evaluations, view vendor scores, review ZKP validity, and award tenders.
- **Officer Profile & DID:** Management of official government DID and ML-DSA cryptographic signing credentials.

### 2. 🪪 Credential Issuer Authority (`ISSUER`)
- **Vendor Onboarding:** Review vendor registration documents, tax numbers, and corporate credentials.
- **Verifiable Credential Lifecycle:** Issue, revoke, or inspect W3C Verifiable Credentials (`annualTurnover`, `experienceYears`, `completedProjects`).
- **Cryptographic Signatures:** Sign vendor credentials using NIST post-quantum ML-DSA-65 signatures.
- **Audit Logging:** Maintain immutable audit trails of all issued credentials and verification checks.

### 3. 💼 Vendor / Bidder Portal (`VENDOR`)
- **Tender Marketplace:** Search and filter public tenders with live status, budgets, and deadlines.
- **ZK Eligibility Verifier:** Generate zk-SNARK proofs locally to check eligibility without leaking figures.
- **Sealed Bid Submission:** 6-step bidding wizard featuring ML-KEM post-quantum payload encryption.
- **Bid Tracking:** Visual milestone timeline from submission, cryptographic verification, evaluation, to award.
- **Identity & Wallet:** Digital credential vault and organization profile management.

---

## 🧮 Evaluation Model: AHP + Min-Max + WSM

ZK-Tender implements a 3-stage mathematical framework for fair tender evaluation:

### Stage 1: Analytic Hierarchy Process (AHP)
Criteria weights are established using a pairwise comparison matrix $A = [a_{ij}]$:
$$w_i = \frac{1}{n} \sum_{j=1}^{n} \frac{a_{ij}}{\sum_{k=1}^n a_{kj}}$$
The matrix is strictly validated for logical consistency. The Consistency Ratio must satisfy:
$$CR = \frac{CI}{RI} \le 0.10 \quad \text{where} \quad CI = \frac{\lambda_{\max} - n}{n - 1}$$
*(If $CR > 0.10$, the matrix is mathematically rejected to prevent inconsistent weightings).*

### Stage 2: Min-Max Normalization
Criteria are normalized to a uniform scale $[0, 1]$:
- **Benefit Criteria** (e.g., Technical Score, Experience, Past Performance):
  $$r_{ij} = \frac{x_{ij} - \min_i(x_{ij})}{\max_i(x_{ij}) - \min_i(x_{ij})}$$
- **Cost Criteria** (e.g., Bid Price):
  $$r_{ij} = \frac{\max_i(x_{ij}) - x_{ij}}{\max_i(x_{ij}) - \min_i(x_{ij})}$$

### Stage 3: Weighted Sum Model (WSM) & Ranking
For each candidate $i$, the composite score $S_i$ is computed:
$$S_i = \sum_{j=1}^{m} w_j \cdot r_{ij}$$
Candidates are ranked in descending order of $S_i$. Ties are resolved deterministically (higher technical score followed by lower price).

---

## 💻 Technology Stack

### Cryptography & Zero-Knowledge
| Tool / Library | Version | Purpose |
|---|---|---|
| **Circom** | `2.0.0` | ZKP arithmetic circuit compiler (`circuits/eligibility.circom`) |
| **SnarkJS** | `^0.7.6` | Groth16 witness computation, proof generation, and verification |
| **@noble/post-quantum** | `^0.7.0` | NIST FIPS 203 (ML-KEM-768 Kyber) & FIPS 204 (ML-DSA-65 Dilithium) |

### Blockchain & Smart Contracts
| Tool / Library | Version | Purpose |
|---|---|---|
| **Solidity** | `^0.8.24` / `^0.8.28` | Smart contract development (`contracts/TenderRegistry.sol`) |
| **Hardhat** | `^2.29.1` | Local Ethereum node, testing framework, compilation, and deployment |
| **Ethers.js** | `^6.17.0` | Blockchain RPC interaction, wallet integration, and transaction signing |
| **Sepolia Testnet** | EVM | Target public Ethereum testnet for on-chain anchoring |

### Backend API
| Tool / Library | Version | Purpose |
|---|---|---|
| **Node.js** | `>=18.x` | Server runtime environment |
| **Express** | `^5.2.1` | High-performance HTTP RESTful API framework |
| **MongoDB / Mongoose**| `^9.9.3` | Object document modeling & off-chain tender/bid datastore |
| **BcryptJS** | `^3.0.3` | Salted password hashing |
| **Nodemailer & Google APIs** | `^9.0.5` / `^174.0` | Automated transactional OTP, notification, and award dispatch |

### Frontend Application
| Tool / Library | Version | Purpose |
|---|---|---|
| **React** | `^18.3.1` | Declarative component UI framework |
| **Vite** | `^5.4.1` | Lightning-fast frontend development server and bundler |
| **Lucide React** | `^0.428.0` | Modern SVG iconography |
| **Vanilla CSS3** | Custom | Glassmorphic design system with sleek Dark/Light theme toggle |

---

## 📂 Repository Directory Structure

```plaintext
ZK-Tender/
├── contracts/                        # Solidity Smart Contracts
│   ├── Lock.sol                      # Timelock escrow contract
│   └── TenderRegistry.sol            # Enterprise Tender Registry & on-chain anchor
├── circuits/                         # Zero-Knowledge Circuit Definitions
│   └── eligibility.circom            # Circom circuit for Groth16 range proofs
├── scripts/                          # Hardhat Deployment & Helper Scripts
│   ├── deploy.js                     # Deploy TenderRegistry to network
│   └── createAndStoreTender.js       # Script to anchor sample tender on-chain
├── test/                             # Comprehensive Automated Unit & Integration Tests
│   ├── TenderRegistry.js             # Smart contract lifecycle & duplication tests
│   ├── eligibilityZkp.test.js        # Zero-Knowledge range proof verification tests
│   ├── pqcMlkem.test.js              # ML-KEM-768 key exchange & AES-GCM tests
│   ├── pqcMldsa.test.js              # ML-DSA-65 digital signature tests
│   ├── vcZkpWorkflow.test.js         # 12-scenario Verifiable Credential ZKP workflow
│   ├── bidEvaluation.test.js         # AHP, Min-Max, WSM evaluation & ranking tests
│   └── Lock.js                       # Hardhat escrow unit tests
├── backend/                          # Express.js REST API Server
│   ├── config/                       # Configuration helpers (email, db)
│   ├── controllers/                  # Route handlers (auth, tender, did, etc.)
│   ├── models/                       # Mongoose Data Models (14 models)
│   │   ├── User.js                   # System users & authentication
│   │   ├── Tender.js                 # Tender specifications & criteria
│   │   ├── VendorBid.js              # Encrypted vendor bids & commitments
│   │   ├── VendorCredential.js       # W3C Verifiable Credentials
│   │   ├── DIDDocument.js            # Decentralized Identifier documents
│   │   ├── EvaluationResult.js       # AHP-WSM scoring outputs
│   │   └── AuditLog.js               # Immutable action logs
│   ├── routes/                       # Express router definitions
│   ├── services/                     # Core Business & Cryptographic Engines
│   │   ├── zkpEligibilityEngine.js   # Groth16 proof calculation & verifier
│   │   ├── mlkemService.js           # Post-quantum ML-KEM-768 encapsulation
│   │   ├── mldsaService.js           # Post-quantum ML-DSA-65 signature service
│   │   ├── bidEvaluationService.js   # AHP + Min-Max + WSM evaluation engine
│   │   └── blockchainService.js      # Ethers.js smart contract connector
│   ├── db.js                         # MongoDB connection & auto-seeding engine
│   ├── seedAdmin.js                  # Standalone admin account seeder
│   ├── seedIssuer.js                 # Standalone credential issuer seeder
│   └── index.js                      # Backend application entry point
├── frontend/                         # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── components/               # UI components & dashboards
│   │   │   ├── AuthorityDashboard.jsx # Officer tender management portal
│   │   │   ├── IssuerDashboard.jsx   # Credential issuer management portal
│   │   │   ├── UserDashboard.jsx     # Vendor bidding & credential portal
│   │   │   ├── CreateTenderForm.jsx  # Multi-step tender creation form
│   │   │   ├── TenderEvaluationDetail.jsx # Live AHP evaluation & scoring
│   │   │   ├── WalletConnectButton.jsx# Web3 MetaMask wallet connector
│   │   │   └── vendor/               # Vendor sub-components (status, results)
│   │   ├── services/                 # Frontend PQC & client services
│   │   ├── context/                  # React Contexts (WalletContext, etc.)
│   │   ├── hooks/                    # Custom hooks (session timeout, etc.)
│   │   ├── App.jsx                   # Main application router & role switcher
│   │   ├── main.jsx                  # React application root mount
│   │   └── styles.css                # Global design system & theme tokens
│   ├── index.html                    # HTML5 entry template
│   └── vite.config.js                # Vite build & local dev server configuration
├── hardhat.config.js                 # Hardhat configuration (Solidity 0.8.24/0.8.28)
└── package.json                      # Root workspace scripts & dev dependencies
```

---

## 📋 Prerequisites & Requirements

Before setting up the project, make sure you have the following installed on your system:

- **Node.js:** `v18.x` or `v20.x` (LTS recommended)
- **npm:** `v9.x` or higher
- **MongoDB:** Active [MongoDB Atlas](https://www.mongodb.com/) cluster URI or local MongoDB daemon (`mongodb://localhost:27017/zk-tender`)
- **Web3 Wallet:** [MetaMask](https://metamask.io/) browser extension installed (for blockchain transactions)
- **Git:** Version control

---

## 🚀 Initial Setup & Installation Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/Pradeep-007-hash/ZK-Tender.git
cd ZK-Tender
```

### Step 2: Install Root Dependencies & Compile Smart Contracts
In the root directory, install dependencies and compile the Solidity contracts:
```bash
npm install
npx hardhat compile
```

### Step 3: Configure Root Environment
Create a `.env` file in the root directory:
```bash
# Copy or create root .env
touch .env
```
Populate with your Ethereum RPC and MongoDB details (see [Environment Variables Configuration](#-environment-variables-configuration)).

### Step 4: Setup & Launch Backend Server
Open a new terminal window, navigate to the `backend/` directory, install packages, and start the API:
```bash
cd backend
npm install
npm start
```
> **Note:** On launch, the backend connects to MongoDB Atlas and **automatically seeds** default government authority and credential issuer accounts. The server will run on `http://localhost:5000`.

### Step 5: Setup & Launch Frontend Client
Open another terminal window, navigate to the `frontend/` directory, install packages, and start Vite:
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server will launch on `http://localhost:3000`.

---

<!-- ## 🔐 Environment Variables Configuration

### 1. Root `.env` (`/ZK-Tender/.env`)
Used by Hardhat and root deployment scripts:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key_or_alchemy
PRIVATE_KEY=your_ethereum_wallet_private_key_without_0x_or_with_0x
CONTRACT_ADDRESS=0xD796C483CdAea7389bBfC379Ed602f4BC8C9a994
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ZK-TendersDB?retryWrites=true&w=majority
```

### 2. Backend `.env` (`/backend/.env`)
Used by the Express.js API server:
```env
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB Database Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ZK-TendersDB?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ZK-TendersDB?retryWrites=true&w=majority

# Direct SMTP or Gmail App Password for OTPs & Alerts
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_16_char_app_password
SMTP_USER=your_email@domain.com
SMTP_PASS=your_smtp_app_password

# (Optional) Google OAuth2 Credentials
CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
CLIENT_SECRET=your_google_oauth_client_secret
REDIRECT_URI=https://developers.google.com/oauthplayground
REFRESH_TOKEN=your_google_refresh_token
```

### 3. Frontend `.env` (`/frontend/.env`)
Used by the Vite frontend:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_PROJECT_ID=zk-tender
VITE_GOOGLE_REDIRECT_URI_1=https://developers.google.com/oauthplayground
VITE_GOOGLE_REDIRECT_URI_2=http://localhost:5000/auth/google/callback
``` -->

---

## 🔑 Pre-Seeded System Credentials

The backend automatically provisions these administrative accounts into your database on startup:

| Portal Role | Registered Email | Password | Pre-Assigned Organization ID | Permissions |
|---|---|---|---|---|
| **Procurement Authority Officer** | `officer@gov.in` | `Admin@123` | `GOV001` | Create & publish tenders, anchor to blockchain, trigger AHP evaluations, award tenders |
| **Government Credential Issuer** | `issuer@gov.in` | `Admin@123` | `GOV_ISSUER_001` | Review vendor applications, issue/revoke W3C VCs, inspect cryptographic audit logs |
| **Vendor / Bidder** | Any self-registered email | Custom | Dynamic / Self-managed | Browse live tenders, generate ZK proofs, submit quantum-sealed bids |

---

## 🧪 Testing Suite

ZK-Tender contains a comprehensive automated test suite covering all layers of the architecture (Smart Contracts, ZKP Verification, Post-Quantum Cryptography, and Algorithmic Evaluation).

To execute the entire test suite, run:
```bash
npx hardhat test
```

### Test Suite Summary:
```plaintext
  Bid Evaluation Module (AHP + Min-Max + WSM + Ranking)
    ✔ TEST 1: AHP calculation MUST produce normalized weights summing to 1.0
    ✔ TEST 2: Invalid or non-square AHP matrix MUST throw an explicit validation error
    ✔ TEST 3: Inconsistent AHP pairwise matrix (CR > 0.10) MUST be rejected with error
    ✔ TEST 4: Min-Max normalization for BENEFIT criterion MUST map max -> 1.0 and min -> 0.0
    ✔ TEST 5: Min-Max normalization for COST criterion (Price) MUST map min -> 1.0 and max -> 0.0
    ✔ TEST 6: When max equals min, normalized score MUST equal 1.0 for all candidates
    ✔ TEST 7: WSM MUST calculate final composite score as Σ (weight_j * normalized_j)
    ✔ TEST 8: Ranking MUST sort candidates in DESCENDING order of final score
    ✔ TEST 9: Tied final scores MUST be broken deterministically by tech score then price
    ✔ TEST 10-18: Edge cases, zero vendors, string handling, single vendor, roundtrip pipeline

  Vendor Eligibility ZKP Verification Engine
    ✔ Case 1: Vendor (8 exp, 25 cr, 7 proj) MUST be ELIGIBLE for Tender (5, 10, 3)
    ✔ Case 2-4: Vendors below thresholds MUST fail verification
    ✔ Case 5: Exact boundary case (5, 10, 3) MUST be ELIGIBLE
    ✔ Case 6-7: Cross-tender replay attacks MUST be REJECTED via policyHash mismatch
    ✔ Case 8: Output signals MUST NOT leak private witness inputs
    ✔ Case 9-10: VC metadata validation in public signals

  Post-Quantum Digital Signature Layer (ML-DSA-65)
    ✔ TEST 1: Valid signed vendor credential passes ML-DSA-65 verification
    ✔ TEST 2-4: Modified claims or vendor binding mismatch fail verification
    ✔ TEST 5-8: Modified policies or expired credentials are rejected
    ✔ TEST 9-12: Complete ML-DSA signed credential + signed policy + ZKP proof verification

  Post-Quantum Cryptography (PQC) ML-KEM-768 & AES-256-GCM Layer
    ✔ Test 1: Server ML-KEM-768 key pair generation
    ✔ Test 2: Client encapsulation & server decapsulation yield matching shared secrets
    ✔ Test 3: Plaintext encrypted with HKDF derived AES-256-GCM key decrypts accurately
    ✔ Test 4: Modified ciphertext or authentication tag fails AES-GCM decryption
    ✔ Test 5-7: Unique IV generation, zero private key leakage, and end-to-end PQC session

  TenderRegistry Smart Contract
    ✔ Should set correct contract owner
    ✔ Should start with 0 total tenders
    ✔ Should allow creating a tender and emitting TenderCreated event
    ✔ Should fail if tender ID is duplicated

  Refactored VC-Based ZKP Tender Verification Workflow (12 Required Scenarios)
    ✔ Scenarios 1-12: Full end-to-end security matrix verifying signature integrity,
       expiration, revocation, parameter bounds, tampering resistance, and cross-tender protection.

  73 passing (5s)
```

---

## 🌐 API Reference

The backend Express server exposes modular, secure REST endpoints:

### Authentication & Profiles
- `POST /api/auth/register` - Register a new vendor account
- `POST /api/auth/login` - Authenticate user credentials & receive session token
- `POST /api/auth/forgot-password` - Request password reset OTP via email
- `POST /api/auth/verify-otp` - Verify email OTP token
- `POST /api/auth/reset-password` - Reset account password

### Tender Management
- `GET /api/tenders` - Fetch all public tenders
- `GET /api/tenders/:id` - Fetch tender specifications and blockchain hashes
- `POST /api/tenders` - Create new tender and trigger on-chain anchoring
- `PATCH /api/tenders/:id/status` - Update tender lifecycle state

### Zero-Knowledge & Post-Quantum Cryptography
- `POST /api/pqc/session` - Initialize ML-KEM-768 ephemeral key exchange
- `POST /api/pqc/encapsulate` - Complete client key encapsulation
- `POST /api/mldsa/sign` - Generate ML-DSA-65 digital signature
- `POST /api/mldsa/verify` - Verify ML-DSA-65 digital signature

### Bid Evaluation & Multi-Criteria Decision Making
- `POST /api/tenders/:id/evaluate` - Execute full AHP + Min-Max + WSM evaluation pipeline
- `GET /api/tenders/:id/results` - Fetch normalized scores, matrix weights, and winner ranking

### W3C DID & Verifiable Credentials
- `POST /api/did/nonce` - Generate wallet authentication nonce
- `POST /api/did/create` - Register a new Decentralized Identifier document
- `GET /api/did/:did` - Resolve W3C DID document
- `POST /api/issuer/credentials` - Issue cryptographically signed Verifiable Credential
- `GET /api/issuer/credentials` - List all issued, active, or revoked credentials
- `PATCH /api/issuer/credentials/:id/revoke` - Revoke an issued Verifiable Credential

---

## ⛓️ Smart Contract Deployment

To deploy the `TenderRegistry.sol` contract to an Ethereum network:

### Local Hardhat Network:
```bash
# Terminal 1: Launch local EVM node
npx hardhat node

# Terminal 2: Deploy contract to local node
npx hardhat run scripts/deploy.js --network localhost
```

### Public Sepolia Testnet:
Ensure `SEPOLIA_RPC_URL` and `PRIVATE_KEY` are configured in `.env`, then run:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
Upon completion, copy the resulting deployed contract address into your root `.env` under `CONTRACT_ADDRESS`.

---

## 🛡️ Security & Quantum-Safety Guarantees

1. **Zero-Knowledge Soundness & Completeness:**
   Groth16 polynomial checks ensure that an unqualified vendor has a negligible probability of generating a valid proof without meeting the criteria.
2. **Post-Quantum Forward Secrecy:**
   Traditional RSA-2048 and ECC-256 can be broken by Shor's algorithm on a sufficiently large quantum computer. ZK-Tender employs lattice-based ML-KEM-768 and ML-DSA-65, safeguarding sealed bids against future retroactive decryption.
3. **Single Application Invariant:**
   The backend and smart contract enforce single-submission constraints per vendor DID, eliminating Sybil bidding and denial-of-service flood vectors.
4. **Automated Inactivity Protection:**
   The frontend enforces an automated 15-minute inactivity session timeout with memory wipe to prevent unauthorized local terminal hijacking.
5. **Replay Attack Resistance:**
   All ZKP eligibility proofs cryptographically incorporate a unique `policyHash` binding the proof strictly to one specific tender. Proofs cannot be reused across different tenders.

---

## 🤝 Contributing & License

Contributions, bug reports, and pull requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Ensure all tests pass (`npx hardhat test`)
5. Push to the Branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

This project is licensed under the **ISC License**.
