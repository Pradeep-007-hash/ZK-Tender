const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TenderRegistry with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const TenderRegistry = await ethers.getContractFactory("TenderRegistry");
  const tenderRegistry = await TenderRegistry.deploy();
  await tenderRegistry.waitForDeployment();

  const contractAddress = await tenderRegistry.getAddress();
  console.log("\n==========================================");
  console.log("TenderRegistry deployed successfully to:", contractAddress);
  console.log("==========================================\n");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
