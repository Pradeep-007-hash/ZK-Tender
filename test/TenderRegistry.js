const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TenderRegistry", function () {
  let tenderRegistry;
  let owner;
  let authority;
  let otherAccount;

  const dummyHash = ethers.zeroPadValue("0x1234", 32);

  beforeEach(async function () {
    [owner, authority, otherAccount] = await ethers.getSigners();

    const TenderRegistry = await ethers.getContractFactory("TenderRegistry");
    tenderRegistry = await TenderRegistry.deploy();
    await tenderRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await tenderRegistry.owner()).to.equal(owner.address);
    });

    it("Should start with 0 total tenders", async function () {
      expect(await tenderRegistry.totalTenders()).to.equal(0);
    });
  });

  describe("Create Tender", function () {
    it("Should allow creating a tender", async function () {
      const now = Math.floor(Date.now() / 1000);
      const bidStartDate = now + 100;
      const bidDeadline = now + 1000;

      await expect(
        tenderRegistry.connect(authority).createTender(
          "TENDER-001",
          "REF-2026-001",
          "Road Construction Project",
          "Public Works",
          "Open Tender",
          "Infrastructure",
          1000000,
          10000,
          5000000,
          50000,
          1000,
          now,
          bidStartDate,
          bidDeadline,
          now + 2000,
          dummyHash,
          dummyHash,
          dummyHash,
          dummyHash,
          dummyHash,
          dummyHash,
          dummyHash
        )
      )
        .to.emit(tenderRegistry, "TenderCreated")
        .withArgs(1, "TENDER-001", authority.address, (val) => val > 0);

      expect(await tenderRegistry.totalTenders()).to.equal(1);
      expect(await tenderRegistry.getTenderNumber("TENDER-001")).to.equal(1);

      const tender = await tenderRegistry.getTender(1);
      expect(tender.title).to.equal("Road Construction Project");
      expect(tender.authority).to.equal(authority.address);
      expect(tender.status).to.equal(0); // TenderStatus.Draft
    });

    it("Should fail if tender ID is duplicated", async function () {
      const now = Math.floor(Date.now() / 1000);
      const bidStartDate = now + 100;
      const bidDeadline = now + 1000;

      await tenderRegistry.connect(authority).createTender(
        "TENDER-001",
        "REF-2026-001",
        "Road Construction Project",
        "Public Works",
        "Open Tender",
        "Infrastructure",
        1000000,
        10000,
        5000000,
        50000,
        1000,
        now,
        bidStartDate,
        bidDeadline,
        now + 2000,
        dummyHash,
        dummyHash,
        dummyHash,
        dummyHash,
        dummyHash,
        dummyHash,
        dummyHash
      );

      await expect(
        tenderRegistry.connect(authority).createTender(
          "TENDER-001",
          "REF-2026-002",
          "Bridge Project",
          "Public Works",
          "Open Tender",
          "Infrastructure",
          2000000,
          20000,
          10000000,
          100000,
          2000,
          now,
          bidStartDate,
          bidDeadline,
          now + 2000,
          dummyHash,
          dummyHash,
          dummyHash,
          dummyHash,
          dummyHash,
          dummyHash,
          dummyHash
        )
      ).to.be.revertedWith("Tender already exists");
    });
  });
});
