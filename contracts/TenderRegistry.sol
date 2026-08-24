// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TenderRegistry
 * @notice Reusable blockchain registry for ZK-Tender.
 *
 * Full tender data:
 *      MongoDB / File Storage
 *
 * Important tender commitments:
 *      Blockchain
 *
 * One contract can manage many tenders.
 */
contract TenderRegistry {

    // ---------------------------------------------------------
    // ENUMS
    // ---------------------------------------------------------

    enum TenderStatus {
        Draft,
        Published,
        Open,
        ClosingSoon,
        Closed,
        UnderEvaluation,
        Awarded,
        Cancelled
    }

    // ---------------------------------------------------------
    // STRUCTS
    // ---------------------------------------------------------

    struct Tender {
        // Basic information
        string tenderId;
        string referenceNumber;

        // We store short public metadata directly
        string title;
        string tenderType;
        string procurementMethod;
        string category;

        // Financial information
        uint256 estimatedValue;
        uint256 minimumBid;
        uint256 maximumBid;
        uint256 emdAmount;
        uint256 tenderFee;

        // Authority
        address authority;

        // Important timestamps
        uint256 publicationDate;
        uint256 bidStartDate;
        uint256 bidDeadline;
        uint256 expectedAwardDate;

        // Hashes of larger/complex off-chain data
        bytes32 locationHash;
        bytes32 scopeHash;
        bytes32 eligibilityHash;
        bytes32 documentsHash;
        bytes32 evaluationHash;
        bytes32 zkpConfigHash;
        bytes32 governancePolicyHash;

        // Blockchain metadata
        uint256 createdAt;
        uint256 updatedAt;

        TenderStatus status;
    }

    // ---------------------------------------------------------
    // STATE VARIABLES
    // ---------------------------------------------------------

    address public owner;

    uint256 private tenderCounter;

    mapping(uint256 => Tender) private tenders;

    // Maps external tender ID to blockchain record ID
    mapping(string => uint256) public tenderIdToNumber;

    // Prevent duplicate tender IDs
    mapping(string => bool) public tenderExists;

    // ---------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------

    event TenderCreated(
        uint256 indexed tenderNumber,
        string indexed tenderId,
        address indexed authority,
        uint256 timestamp
    );

    event TenderPublished(
        uint256 indexed tenderNumber,
        string indexed tenderId,
        uint256 publicationDate,
        uint256 bidDeadline
    );

    event TenderUpdated(
        uint256 indexed tenderNumber,
        string indexed tenderId,
        uint256 timestamp
    );

    event TenderStatusChanged(
        uint256 indexed tenderNumber,
        string indexed tenderId,
        TenderStatus oldStatus,
        TenderStatus newStatus
    );

    event TenderDeadlineExtended(
        uint256 indexed tenderNumber,
        string indexed tenderId,
        uint256 oldDeadline,
        uint256 newDeadline
    );

    // ---------------------------------------------------------
    // MODIFIERS
    // ---------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyAuthority(uint256 tenderNumber) {
        require(
            msg.sender == tenders[tenderNumber].authority,
            "Not tender authority"
        );
        _;
    }

    modifier tenderMustExist(uint256 tenderNumber) {
        require(
            tenderNumber > 0 && tenderNumber <= tenderCounter,
            "Tender does not exist"
        );
        _;
    }

    // ---------------------------------------------------------
    // CONSTRUCTOR
    // ---------------------------------------------------------

    constructor() {
        owner = msg.sender;
    }

    // ---------------------------------------------------------
    // CREATE TENDER
    // ---------------------------------------------------------

    function createTender(
        string calldata _tenderId,
        string calldata _referenceNumber,
        string calldata _title,
        string calldata _tenderType,
        string calldata _procurementMethod,
        string calldata _category,

        uint256 _estimatedValue,
        uint256 _minimumBid,
        uint256 _maximumBid,
        uint256 _emdAmount,
        uint256 _tenderFee,

        uint256 _publicationDate,
        uint256 _bidStartDate,
        uint256 _bidDeadline,
        uint256 _expectedAwardDate,

        bytes32 _locationHash,
        bytes32 _scopeHash,
        bytes32 _eligibilityHash,
        bytes32 _documentsHash,
        bytes32 _evaluationHash,
        bytes32 _zkpConfigHash,
        bytes32 _governancePolicyHash
    )
        external
        returns (uint256)
    {
        require(
            bytes(_tenderId).length > 0,
            "Tender ID required"
        );

        require(
            !tenderExists[_tenderId],
            "Tender already exists"
        );

        require(
            _bidDeadline > _bidStartDate,
            "Invalid bid timeline"
        );

        require(
            _maximumBid == 0 || _minimumBid <= _maximumBid,
            "Invalid bid range"
        );

        tenderCounter++;

        Tender storage tender = tenders[tenderCounter];

        tender.tenderId = _tenderId;
        tender.referenceNumber = _referenceNumber;

        tender.title = _title;
        tender.tenderType = _tenderType;
        tender.procurementMethod = _procurementMethod;
        tender.category = _category;

        tender.estimatedValue = _estimatedValue;
        tender.minimumBid = _minimumBid;
        tender.maximumBid = _maximumBid;
        tender.emdAmount = _emdAmount;
        tender.tenderFee = _tenderFee;

        tender.authority = msg.sender;

        tender.publicationDate = _publicationDate;
        tender.bidStartDate = _bidStartDate;
        tender.bidDeadline = _bidDeadline;
        tender.expectedAwardDate = _expectedAwardDate;

        tender.locationHash = _locationHash;
        tender.scopeHash = _scopeHash;
        tender.eligibilityHash = _eligibilityHash;
        tender.documentsHash = _documentsHash;
        tender.evaluationHash = _evaluationHash;
        tender.zkpConfigHash = _zkpConfigHash;
        tender.governancePolicyHash = _governancePolicyHash;

        tender.createdAt = block.timestamp;
        tender.updatedAt = block.timestamp;

        tender.status = TenderStatus.Draft;

        tenderIdToNumber[_tenderId] = tenderCounter;
        tenderExists[_tenderId] = true;

        emit TenderCreated(
            tenderCounter,
            _tenderId,
            msg.sender,
            block.timestamp
        );

        return tenderCounter;
    }

    // ---------------------------------------------------------
    // PUBLISH TENDER
    // ---------------------------------------------------------

    function publishTender(uint256 _tenderNumber)
        external
        tenderMustExist(_tenderNumber)
        onlyAuthority(_tenderNumber)
    {
        Tender storage tender = tenders[_tenderNumber];

        require(
            tender.status == TenderStatus.Draft,
            "Tender is not in draft"
        );

        require(
            block.timestamp <= tender.bidDeadline,
            "Bid deadline has passed"
        );

        TenderStatus oldStatus = tender.status;

        tender.status = TenderStatus.Published;
        tender.updatedAt = block.timestamp;

        emit TenderStatusChanged(
            _tenderNumber,
            tender.tenderId,
            oldStatus,
            TenderStatus.Published
        );

        emit TenderPublished(
            _tenderNumber,
            tender.tenderId,
            tender.publicationDate,
            tender.bidDeadline
        );
    }

    // ---------------------------------------------------------
    // OPEN TENDER
    // ---------------------------------------------------------

    function openTender(uint256 _tenderNumber)
        external
        tenderMustExist(_tenderNumber)
        onlyAuthority(_tenderNumber)
    {
        Tender storage tender = tenders[_tenderNumber];

        require(
            tender.status == TenderStatus.Published,
            "Tender is not published"
        );

        require(
            block.timestamp >= tender.bidStartDate,
            "Bid period has not started"
        );

        require(
            block.timestamp < tender.bidDeadline,
            "Bid deadline passed"
        );

        TenderStatus oldStatus = tender.status;

        tender.status = TenderStatus.Open;
        tender.updatedAt = block.timestamp;

        emit TenderStatusChanged(
            _tenderNumber,
            tender.tenderId,
            oldStatus,
            TenderStatus.Open
        );
    }

    // ---------------------------------------------------------
    // CLOSE TENDER
    // ---------------------------------------------------------

    function closeTender(uint256 _tenderNumber)
        external
        tenderMustExist(_tenderNumber)
        onlyAuthority(_tenderNumber)
    {
        Tender storage tender = tenders[_tenderNumber];

        require(
            block.timestamp >= tender.bidDeadline,
            "Bid deadline has not passed"
        );

        TenderStatus oldStatus = tender.status;

        tender.status = TenderStatus.Closed;
        tender.updatedAt = block.timestamp;

        emit TenderStatusChanged(
            _tenderNumber,
            tender.tenderId,
            oldStatus,
            TenderStatus.Closed
        );
    }

    // ---------------------------------------------------------
    // EXTEND DEADLINE
    // ---------------------------------------------------------

    function extendDeadline(
        uint256 _tenderNumber,
        uint256 _newDeadline
    )
        external
        tenderMustExist(_tenderNumber)
        onlyAuthority(_tenderNumber)
    {
        Tender storage tender = tenders[_tenderNumber];

        require(
            _newDeadline > tender.bidDeadline,
            "New deadline must be later"
        );

        require(
            tender.status == TenderStatus.Published ||
            tender.status == TenderStatus.Open,
            "Tender cannot be extended"
        );

        uint256 oldDeadline = tender.bidDeadline;

        tender.bidDeadline = _newDeadline;
        tender.updatedAt = block.timestamp;

        emit TenderDeadlineExtended(
            _tenderNumber,
            tender.tenderId,
            oldDeadline,
            _newDeadline
        );
    }

    // ---------------------------------------------------------
    // UPDATE HASHES
    // ---------------------------------------------------------

    function updateTenderHashes(
        uint256 _tenderNumber,

        bytes32 _locationHash,
        bytes32 _scopeHash,
        bytes32 _eligibilityHash,
        bytes32 _documentsHash,
        bytes32 _evaluationHash,
        bytes32 _zkpConfigHash,
        bytes32 _governancePolicyHash
    )
        external
        tenderMustExist(_tenderNumber)
        onlyAuthority(_tenderNumber)
    {
        Tender storage tender = tenders[_tenderNumber];

        require(
            tender.status == TenderStatus.Draft,
            "Only draft can be updated"
        );

        tender.locationHash = _locationHash;
        tender.scopeHash = _scopeHash;
        tender.eligibilityHash = _eligibilityHash;
        tender.documentsHash = _documentsHash;
        tender.evaluationHash = _evaluationHash;
        tender.zkpConfigHash = _zkpConfigHash;
        tender.governancePolicyHash = _governancePolicyHash;

        tender.updatedAt = block.timestamp;

        emit TenderUpdated(
            _tenderNumber,
            tender.tenderId,
            block.timestamp
        );
    }

    // ---------------------------------------------------------
    // GET TENDER
    // ---------------------------------------------------------

    function getTender(uint256 _tenderNumber)
        external
        view
        tenderMustExist(_tenderNumber)
        returns (Tender memory)
    {
        return tenders[_tenderNumber];
    }

    // ---------------------------------------------------------
    // GET TENDER NUMBER
    // ---------------------------------------------------------

    function getTenderNumber(string calldata _tenderId)
        external
        view
        returns (uint256)
    {
        require(
            tenderExists[_tenderId],
            "Tender does not exist"
        );

        return tenderIdToNumber[_tenderId];
    }

    // ---------------------------------------------------------
    // TOTAL TENDERS
    // ---------------------------------------------------------

    function totalTenders()
        external
        view
        returns (uint256)
    {
        return tenderCounter;
    }

    // ---------------------------------------------------------
    // TRANSFER OWNERSHIP
    // ---------------------------------------------------------

    function transferOwnership(address _newOwner)
        external
        onlyOwner
    {
        require(
            _newOwner != address(0),
            "Invalid owner"
        );

        owner = _newOwner;
    }

    // ---------------------------------------------------------
    // VENDOR BID COMMITMENT & ZKP PROOF ANCHORS
    // ---------------------------------------------------------

    struct BidCommitment {
        string tenderId;
        string vendorId;
        bytes32 criteriaHash;
        bytes32 proofCommitment;
        bool isEligible;
        uint256 submittedAt;
    }

    mapping(string => mapping(string => BidCommitment)) private bidCommitments;

    event BidSubmittedOnChain(
        string indexed tenderId,
        string indexed vendorId,
        bytes32 criteriaHash,
        bytes32 proofCommitment,
        bool isEligible,
        uint256 timestamp
    );

    function submitBidCommitment(
        string calldata _tenderId,
        string calldata _vendorId,
        bytes32 _criteriaHash,
        bytes32 _proofCommitment,
        bool _isEligible
    ) external {
        require(bytes(_tenderId).length > 0, "Tender ID required");
        require(bytes(_vendorId).length > 0, "Vendor ID required");

        bidCommitments[_tenderId][_vendorId] = BidCommitment({
            tenderId: _tenderId,
            vendorId: _vendorId,
            criteriaHash: _criteriaHash,
            proofCommitment: _proofCommitment,
            isEligible: _isEligible,
            submittedAt: block.timestamp
        });

        emit BidSubmittedOnChain(
            _tenderId,
            _vendorId,
            _criteriaHash,
            _proofCommitment,
            _isEligible,
            block.timestamp
        );
    }

    function getBidCommitment(
        string calldata _tenderId,
        string calldata _vendorId
    ) external view returns (BidCommitment memory) {
        return bidCommitments[_tenderId][_vendorId];
    }
}
