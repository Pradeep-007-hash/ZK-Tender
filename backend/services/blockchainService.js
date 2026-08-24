const { ethers } = require("ethers");
require("dotenv").config();

// TenderRegistry ABI for createTender & events
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

async function registerTenderOnChain(tenderData) {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  let privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS || "0xD796C483CdAea7389bBfC379Ed602f4BC8C9a994";

  if (!rpcUrl || !privateKey) {
    console.warn("[BLOCKCHAIN SERVICE] SEPOLIA_RPC_URL or PRIVATE_KEY not configured. Skipping on-chain transaction.");
    return null;
  }

  if (!privateKey.startsWith("0x")) {
    privateKey = `0x${privateKey}`;
  }

  try {
    console.log(`[BLOCKCHAIN SERVICE] Connecting to Sepolia via ${rpcUrl.substring(0, 30)}...`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, TENDER_REGISTRY_ABI, wallet);

    // Generate hashes for off-chain data
    const locationHash = generateHash(tenderData.workAddress || tenderData.city || tenderData.state || "Location");
    const scopeHash = generateHash(tenderData.detailedScope || tenderData.executiveSummary || "Scope");
    const eligibilityHash = generateHash(tenderData.eligibilityRequirementsList || "Eligibility");
    const documentsHash = generateHash(tenderData.requiredDocsList || tenderData.attachmentsList || "Documents");
    const evaluationHash = generateHash(tenderData.evaluationCriteriaList || "Evaluation");
    const zkpConfigHash = generateHash(tenderData.zkpConfig || tenderData.zkpRule || "ZKPConfig");
    const governancePolicyHash = generateHash(tenderData.governancePoliciesList || "Governance");

    const now = Math.floor(Date.now() / 1000);
    const pubDate = tenderData.pubDate ? Math.floor(new Date(tenderData.pubDate).getTime() / 1000) : now;
    const bidStartDate = tenderData.bidStartDate ? Math.floor(new Date(tenderData.bidStartDate).getTime() / 1000) : now + 60;
    const bidDeadline = tenderData.submissionDeadline ? Math.floor(new Date(tenderData.submissionDeadline).getTime() / 1000) : now + 86400 * 30;
    const awardDate = tenderData.awardDate ? Math.floor(new Date(tenderData.awardDate).getTime() / 1000) : now + 86400 * 45;

    console.log(`[BLOCKCHAIN SERVICE] Submitting createTender for ${tenderData.tenderId} on contract ${contractAddress}...`);

    const tx = await contract.createTender(
      tenderData.tenderId,
      tenderData.refNumber || `REF-${tenderData.tenderId}`,
      tenderData.title || "Untitled Tender",
      tenderData.tenderType || "E-Tender",
      tenderData.procurementMethod || "Competitive Bidding",
      tenderData.category || "Infrastructure",
      BigInt(tenderData.estimatedValue || 0),
      BigInt(tenderData.minBid || 0),
      BigInt(tenderData.maxBidCeiling || 0),
      BigInt(tenderData.emdAmount || 0),
      BigInt(tenderData.docFeeAmount || 0),
      pubDate,
      bidStartDate,
      bidDeadline,
      awardDate,
      locationHash,
      scopeHash,
      eligibilityHash,
      documentsHash,
      evaluationHash,
      zkpConfigHash,
      governancePolicyHash
    );

    console.log(`[BLOCKCHAIN SERVICE] Transaction sent: ${tx.hash}. Waiting for confirmation...`);
    const receipt = await tx.wait();
    console.log(`[BLOCKCHAIN SERVICE] Transaction confirmed in block ${receipt.blockNumber}!`);

    let onChainTenderNumber = 0;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === "TenderCreated") {
          onChainTenderNumber = Number(parsedLog.args.tenderNumber);
          break;
        }
      } catch (e) {
        // Ignore logs from other contracts if any
      }
    }

    return {
      txHash: tx.hash,
      contractAddress,
      onChainTenderNumber,
      hashes: {
        locationHash,
        scopeHash,
        eligibilityHash,
        documentsHash,
        evaluationHash,
        zkpConfigHash,
        governancePolicyHash
      }
    };
  } catch (error) {
    console.error("[BLOCKCHAIN SERVICE ERROR]", error.message);
    throw error;
  }
}

module.exports = {
  registerTenderOnChain,
  generateHash
};
