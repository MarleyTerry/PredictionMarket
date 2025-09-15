import { ethers } from "hardhat";

async function main() {
  console.log("Deploying PredictionMarket contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the PredictionMarket contract
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy();

  await predictionMarket.waitForDeployment();
  const contractAddress = await predictionMarket.getAddress();

  console.log("PredictionMarket deployed to:", contractAddress);
  
  // Save the contract address and ABI for frontend use
  const fs = require("fs");
  const contractInfo = {
    address: contractAddress,
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync("./src/deployments")) {
    fs.mkdirSync("./src/deployments", { recursive: true });
  }

  // Save contract address
  fs.writeFileSync(
    "./src/deployments/PredictionMarket.json",
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("Contract info saved to src/deployments/PredictionMarket.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });