const mongoose = require("mongoose");
const { ethers } = require("ethers");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://2312034:Pradeep@pradeepdatabase.iszxesl.mongodb.net/ZK-TendersDB?retryWrites=true&w=majority&appName=PradeepDatabase";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
let PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xD796C483CdAea7389bBfC379Ed602f4BC8C9a994";

if (PRIVATE_KEY && !PRIVATE_KEY.startsWith("0x")) {
  PRIVATE_KEY = `0x${PRIVATE_KEY}`;
}

// Mongoose Tender Schema
const TenderSchema = new mongoose.Schema({}, { strict: false });
const Tender = mongoose.models.Tender || mongoose.model("Tender", TenderSchema);

// TenderRegistry ABI
const TENDER_REGISTRY_ABI = [
  "function createTender(string _tenderId, string _referenceNumber, string _title, string _tenderType, string _procurementMethod, string _category, uint256 _estimatedValue, uint256 _minimumBid, uint256 _maximumBid, uint256 _emdAmount, uint256 _tenderFee, uint256 _publicationDate, uint256 _bidStartDate, uint256 _bidDeadline, uint256 _expectedAwardDate, bytes32 _locationHash, bytes32 _scopeHash, bytes32 _eligibilityHash, bytes32 _documentsHash, bytes32 _evaluationHash, bytes32 _zkpConfigHash, bytes32 _governancePolicyHash) external returns (uint256)",
  "function getTender(uint256 _tenderNumber) external view returns (tuple(string tenderId, string referenceNumber, string title, string tenderType, string procurementMethod, string category, uint256 estimatedValue, uint256 minimumBid, uint256 maximumBid, uint256 emdAmount, uint256 tenderFee, address authority, uint256 publicationDate, uint256 bidStartDate, uint256 bidDeadline, uint256 expectedAwardDate, bytes32 locationHash, bytes32 scopeHash, bytes32 eligibilityHash, bytes32 documentsHash, bytes32 evaluationHash, bytes32 zkpConfigHash, bytes32 governancePolicyHash, uint256 createdAt, uint256 updatedAt, uint8 status))",
  "function totalTenders() external view returns (uint256)",
  "event TenderCreated(uint256 indexed tenderNumber, string indexed tenderId, address indexed authority, uint256 timestamp)"
];

function generateHash(data) {
  if (!data) return ethers.zeroPadValue("0x00", 32);
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return ethers.keccak256(ethers.toUtf8Bytes(str));
}

async function main() {
  console.log("=================================================");
  console.log("Dual Storage: MongoDB + Sepolia Smart Contract");
  console.log("=================================================\n");

  // Step 1: Connect to MongoDB
  console.log("[1/3] Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGO_URI);
  console.log("-> Connected to MongoDB Atlas successfully!\n");

  // Sample Tender Data
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const tenderData = {
    tenderId: `TND-SEPOLIA-${randomId}`,
    refNumber: `REF-2026-${randomId}`,
    title: `Smart Highway Expansion Project #${randomId}`,
    department: "Ministry of Road Transport & Highways",
    category: "Infrastructure Construction",
    tenderType: "Open International Competitive Bidding",
    procurementMethod: "Two-Stage Sealed Bidding",
    estimatedValue: 15000000,
    minBid: 10000000,
    maxBidCeiling: 20000000,
    emdAmount: 300000,
    docFeeAmount: 5000,
    workAddress: "NH-48 Highway Stretch, MH, India",
    detailedScope: "Six-lane road expansion with automated tolling & smart IoT monitoring.",
    pubDate: new Date().toISOString(),
    bidStartDate: new Date(Date.now() + 60000).toISOString(),
    submissionDeadline: new Date(Date.now() + 86400000 * 30).toISOString(),
    awardDate: new Date(Date.now() + 86400000 * 45).toISOString(),
    status: "Published",
    createdAt: new Date()
  };

  // Step 2: Register on Sepolia Smart Contract
  console.log("[2/3] Registering Tender on Sepolia Smart Contract...");
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, TENDER_REGISTRY_ABI, wallet);

  console.log(`-> Authority Wallet: ${wallet.address}`);
  console.log(`-> Contract Address: ${CONTRACT_ADDRESS}`);

  const locationHash = generateHash(tenderData.workAddress);
  const scopeHash = generateHash(tenderData.detailedScope);
  const eligibilityHash = generateHash(["Class A Contractor License", "Min Turnover ₹10 Cr"]);
  const documentsHash = generateHash(["BOQ.pdf", "TechnicalSpecs.pdf", "SitePlan.dwg"]);
  const evaluationHash = generateHash({ technicalWeight: 70, financialWeight: 30 });
  const zkpConfigHash = generateHash({ minTurnoverZKP: true, taxComplianceZKP: true });
  const governancePolicyHash = generateHash("Governance Standard v2026.1");

  const now = Math.floor(Date.now() / 1000);
  const tx = await contract.createTender(
    tenderData.tenderId,
    tenderData.refNumber,
    tenderData.title,
    tenderData.tenderType,
    tenderData.procurementMethod,
    tenderData.category,
    BigInt(tenderData.estimatedValue),
    BigInt(tenderData.minBid),
    BigInt(tenderData.maxBidCeiling),
    BigInt(tenderData.emdAmount),
    BigInt(tenderData.docFeeAmount),
    now,
    now + 60,
    now + 86400 * 30,
    now + 86400 * 45,
    locationHash,
    scopeHash,
    eligibilityHash,
    documentsHash,
    evaluationHash,
    zkpConfigHash,
    governancePolicyHash
  );

  console.log(`-> Transaction sent! Tx Hash: ${tx.hash}`);
  console.log("-> Waiting for block confirmation on Sepolia...");
  const receipt = await tx.wait();
  console.log(`-> Confirmed in block ${receipt.blockNumber}!\n`);

  let onChainTenderNumber = 0;
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log);
      if (parsedLog && parsedLog.name === "TenderCreated") {
        onChainTenderNumber = Number(parsedLog.args.tenderNumber);
        break;
      }
    } catch (e) {}
  }

  // Step 3: Save to MongoDB
  console.log("[3/3] Saving Full Tender Metadata to MongoDB Atlas...");
  const fullTenderRecord = {
    ...tenderData,
    contractAddress: CONTRACT_ADDRESS,
    txHash: tx.hash,
    onChainTenderNumber,
    locationHash,
    scopeHash,
    eligibilityHash,
    documentsHash,
    evaluationHash,
    zkpConfigHash,
    governancePolicyHash
  };

  const savedTender = await Tender.create(fullTenderRecord);
  console.log("-> Saved to MongoDB Atlas successfully!");
  console.log(`-> MongoDB Document ID: ${savedTender._id}`);

  console.log("\n=================================================");
  console.log(" SUCCESS: Tender Stored in Both MongoDB & Sepolia!");
  console.log("=================================================");
  console.log(`Tender ID:              ${savedTender.tenderId}`);
  console.log(`Title:                  ${savedTender.title}`);
  console.log(`On-Chain Record #:      ${onChainTenderNumber}`);
  console.log(`Contract Address:       ${CONTRACT_ADDRESS}`);
  console.log(`Sepolia Tx Hash:        ${tx.hash}`);
  console.log(`Etherscan Link:         https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log("=================================================\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error executing dual storage:", err);
  mongoose.disconnect();
  process.exit(1);
});
