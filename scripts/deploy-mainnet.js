const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 ETHEREUM MAINNET DEPLOYMENT SCRIPT");
  console.log("⚠️  WARNING: This will cost REAL ETH! ⚠️");
  console.log("=======================================\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  
  console.log("📋 Deployment Configuration:");
  console.log(`Deployer address: ${deployerAddress}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${(await deployer.provider.getNetwork()).chainId}`);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  const balanceETH = ethers.utils.formatEther(balance);
  console.log(`Deployer balance: ${balanceETH} ETH`);
  
  if (parseFloat(balanceETH) < 0.1) {
    throw new Error("❌ Insufficient ETH balance! Need at least 0.1 ETH for deployment");
  }
  
  // Estimate gas costs
  console.log("\n💰 Estimating deployment costs...");
  
  // Get current gas price
  const gasPrice = await deployer.provider.getGasPrice();
  const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");
  console.log(`Current gas price: ${gasPriceGwei} Gwei`);
  
  // Estimated gas for contract deployments
  const tokenGasEstimate = 2000000; // ~2M gas for ERC20 with features
  const nftGasEstimate = 3000000;   // ~3M gas for ERC721 with features
  
  const tokenCostETH = ethers.utils.formatEther(gasPrice.mul(tokenGasEstimate));
  const nftCostETH = ethers.utils.formatEther(gasPrice.mul(nftGasEstimate));
  const totalCostETH = ethers.utils.formatEther(gasPrice.mul(tokenGasEstimate + nftGasEstimate));
  
  console.log(`Estimated ChatToken deployment cost: ${tokenCostETH} ETH`);
  console.log(`Estimated ChatbotNFT deployment cost: ${nftCostETH} ETH`);
  console.log(`Total estimated cost: ${totalCostETH} ETH`);
  console.log(`Plus extra for setup transactions: ~${(parseFloat(totalCostETH) * 1.5).toFixed(6)} ETH total`);
  
  // Confirmation prompt (commented out for script - manually verify before running)
  console.log("\n⚠️  FINAL WARNING:");
  console.log("- This will deploy to ETHEREUM MAINNET");
  console.log("- You will spend REAL ETH");
  console.log("- Contracts will be PERMANENT and IMMUTABLE");
  console.log("- Make sure you have audited the contracts");
  console.log("- Ensure you understand token economics\n");
  
  // Uncomment this for safety check:
  // console.log("Please manually verify and comment out this line to continue:");
  // throw new Error("Manual safety check - remove this line to deploy");
  
  console.log("🚀 Starting deployment...\n");
  
  // Deploy ChatToken first
  console.log("1️⃣ Deploying ChatToken to mainnet...");
  const ChatToken = await ethers.getContractFactory("ChatToken");
  
  console.log("   Deploying contract...");
  const chatToken = await ChatToken.deploy({
    gasLimit: tokenGasEstimate,
    gasPrice: gasPrice
  });
  
  console.log("   Waiting for confirmation...");
  await chatToken.deployed();
  console.log(`   ✅ ChatToken deployed to: ${chatToken.address}`);
  console.log(`   📄 Transaction: https://etherscan.io/tx/${chatToken.deployTransaction.hash}`);
  
  // Deploy ChatbotNFT
  console.log("\n2️⃣ Deploying ChatbotNFT to mainnet...");
  const ChatbotNFT = await ethers.getContractFactory("ChatbotNFT");
  
  console.log("   Deploying contract...");
  const chatbotNFT = await ChatbotNFT.deploy({
    gasLimit: nftGasEstimate,
    gasPrice: gasPrice
  });
  
  console.log("   Waiting for confirmation...");
  await chatbotNFT.deployed();
  console.log(`   ✅ ChatbotNFT deployed to: ${chatbotNFT.address}`);
  console.log(`   📄 Transaction: https://etherscan.io/tx/${chatbotNFT.deployTransaction.hash}`);
  
  // Setup initial configuration
  console.log("\n3️⃣ Setting up initial configuration...");
  
  // Mint initial supply to deployer (for liquidity/distribution)
  const initialSupply = ethers.utils.parseEther("100000"); // 100K tokens
  console.log(`   Minting ${ethers.utils.formatEther(initialSupply)} CHAT to deployer...`);
  const mintTx = await chatToken.mintRewards(deployerAddress, initialSupply, {
    gasPrice: gasPrice
  });
  await mintTx.wait();
  console.log(`   ✅ Initial tokens minted`);
  
  // Calculate actual deployment costs
  console.log("\n💰 Calculating actual costs...");
  const finalBalance = await deployer.getBalance();
  const actualCost = balance.sub(finalBalance);
  const actualCostETH = ethers.utils.formatEther(actualCost);
  console.log(`Actual deployment cost: ${actualCostETH} ETH`);
  console.log(`Remaining balance: ${ethers.utils.formatEther(finalBalance)} ETH`);
  
  console.log("\n🎉 MAINNET DEPLOYMENT COMPLETE!");
  console.log("=====================================");
  console.log("📄 Contract Addresses:");
  console.log(`ChatToken (CHAT): ${chatToken.address}`);
  console.log(`ChatbotNFT (AICB): ${chatbotNFT.address}`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Network: Ethereum Mainnet`);
  console.log(`Total Cost: ${actualCostETH} ETH`);
  
  console.log("\n🔍 Etherscan Links:");
  console.log(`ChatToken: https://etherscan.io/address/${chatToken.address}`);
  console.log(`ChatbotNFT: https://etherscan.io/address/${chatbotNFT.address}`);
  
  console.log("\n📝 Environment Variables for Production:");
  console.log(`NEXT_PUBLIC_CHAT_TOKEN_ADDRESS=${chatToken.address}`);
  console.log(`NEXT_PUBLIC_CHATBOT_NFT_ADDRESS=${chatbotNFT.address}`);
  console.log(`NEXT_PUBLIC_NETWORK_ID=1`);
  
  console.log("\n⚠️  IMPORTANT NEXT STEPS:");
  console.log("1. 🔐 VERIFY CONTRACTS on Etherscan (see script below)");
  console.log("2. 🏦 Set up token liquidity (DEX listing)");
  console.log("3. 📱 Update frontend to use mainnet addresses");
  console.log("4. 🔒 Transfer ownership if needed");
  console.log("5. 📊 Set up monitoring and analytics");
  console.log("6. ⚖️  Ensure legal compliance");
  
  console.log("\n🔧 Contract Verification Commands:");
  console.log(`npx hardhat verify --network mainnet ${chatToken.address}`);
  console.log(`npx hardhat verify --network mainnet ${chatbotNFT.address}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: "mainnet",
    chainId: 1,
    deployer: deployerAddress,
    chatToken: chatToken.address,
    chatbotNFT: chatbotNFT.address,
    deploymentCost: actualCostETH,
    gasPrice: gasPriceGwei,
    timestamp: new Date().toISOString(),
    txHashes: {
      chatToken: chatToken.deployTransaction.hash,
      chatbotNFT: chatbotNFT.deployTransaction.hash
    }
  };
  
  const fs = require('fs');
  fs.writeFileSync('mainnet-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to mainnet-deployment.json");
}

main()
  .then(() => {
    console.log("\n✅ Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
