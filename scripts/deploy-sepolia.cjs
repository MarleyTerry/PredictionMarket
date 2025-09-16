const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying PredictionMarket to Sepolia...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy PredictionMarket contract
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy();

  await predictionMarket.waitForDeployment();
  const contractAddress = await predictionMarket.getAddress();

  console.log("✅ PredictionMarket deployed to:", contractAddress);

  // Create some initial demo markets
  console.log("\nCreating demo markets...");

  const demoMarkets = [
    {
      question: "Will Bitcoin reach $150,000 by the end of 2026?",
      duration: Math.floor((new Date('2026-12-31').getTime() - Date.now()) / 1000)
    },
    {
      question: "Will the next US presidential election have record voter turnout?", 
      duration: Math.floor((new Date('2026-11-30').getTime() - Date.now()) / 1000)
    },
    {
      question: "Will AI achieve human-level performance in all cognitive tasks by 2026?",
      duration: Math.floor((new Date('2026-12-31').getTime() - Date.now()) / 1000)
    }
  ];

  for (let i = 0; i < demoMarkets.length; i++) {
    const market = demoMarkets[i];
    try {
      console.log(`Creating market ${i + 1}: ${market.question}`);
      
      const tx = await predictionMarket.createMarket(market.question, market.duration);
      const receipt = await tx.wait();
      
      console.log(`✅ Market ${i + 1} created. TX: ${receipt.hash}`);
      
    } catch (error) {
      console.error(`❌ Failed to create market ${i + 1}:`, error.message);
    }
  }

  // Verify final state
  const totalMarkets = await predictionMarket.getTotalMarkets();
  console.log(`\n🎉 Deployment complete!`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Total Markets Created: ${totalMarkets}`);
  console.log(`Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });