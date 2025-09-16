const { ethers } = require("hardhat");

async function main() {
  console.log("Initializing demo markets...");

  // 获取已部署的合约
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = PredictionMarket.attach(contractAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // 检查当前市场数量
  const currentMarkets = await predictionMarket.getTotalMarkets();
  console.log("Current markets count:", currentMarkets.toString());

  // 如果已经有市场，跳过初始化
  if (currentMarkets > 0) {
    console.log("Demo markets already exist, skipping initialization");
    return;
  }

  // 创建演示市场
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

  console.log("Creating demo markets...");

  for (let i = 0; i < demoMarkets.length; i++) {
    const market = demoMarkets[i];
    try {
      console.log(`Creating market ${i + 1}: ${market.question}`);
      
      const tx = await predictionMarket.createMarket(
        market.question,
        market.duration,
        {
          gasLimit: 500000 // 设置适当的gas限制
        }
      );
      
      const receipt = await tx.wait();
      console.log(`✅ Market ${i + 1} created. Transaction hash: ${receipt.hash}`);
      
      // 等待一下再创建下一个市场
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to create market ${i + 1}:`, error);
    }
  }

  // 验证创建结果
  const finalMarketCount = await predictionMarket.getTotalMarkets();
  console.log(`🎉 Demo initialization complete! Total markets: ${finalMarketCount}`);

  // 显示创建的市场信息
  for (let i = 0; i < finalMarketCount; i++) {
    const marketData = await predictionMarket.getMarket(i);
    console.log(`Market ${i}:`, {
      question: marketData[0],
      endTime: new Date(Number(marketData[1]) * 1000).toLocaleString(),
      creator: marketData[6]
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });