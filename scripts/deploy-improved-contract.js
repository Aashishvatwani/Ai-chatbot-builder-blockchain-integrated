const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying ImprovedDailyRewardChatToken with ETH revenue sharing...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy the improved contract
  const ImprovedDailyRewardChatToken = await ethers.getContractFactory("ImprovedDailyRewardChatToken");
  const token = await ImprovedDailyRewardChatToken.deploy(deployer.address);

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("✅ ImprovedDailyRewardChatToken deployed to:", tokenAddress);

  // Set up initial authorization
  console.log("🔐 Setting up authorizations...");
  
  // Authorize the deployer for testing
  await token.authorizeSpender(deployer.address);
  console.log("✅ Authorized deployer as spender");

  // Register a test chatbot
  const testChatbotId = 1;
  await token.registerChatbot(testChatbotId, deployer.address);
  console.log(`✅ Registered test chatbot ${testChatbotId} with owner:`, deployer.address);

  // Display contract info
  console.log("\n📊 Contract Information:");
  console.log("Contract Address:", tokenAddress);
  console.log("Token Name:", await token.name());
  console.log("Token Symbol:", await token.symbol());
  console.log("Total Supply:", ethers.formatEther(await token.totalSupply()), "CHAT");
  console.log("Message Cost:", ethers.formatEther(await token.MESSAGE_COST()), "CHAT");
  console.log("Creator Reward:", ethers.formatEther(await token.CREATOR_REWARD()), "CHAT");
  console.log("Platform Address:", await token.PLATFORM_ADDRESS());
  console.log("ETH to CHAT Rate:", await token.ETH_TO_CHAT_RATE(), "CHAT per ETH");
  
  const [freeMessages, claimAmount] = await token.getDailyLimits();
  console.log("Daily Free Messages:", freeMessages.toString());
  console.log("Daily Claim Amount:", ethers.formatEther(claimAmount), "CHAT");

  // Revenue sharing info
  console.log("\n💰 Revenue Sharing:");
  console.log("Platform ETH Share:", await token.PLATFORM_ETH_SHARE(), "%");
  console.log("Creator ETH Share:", await token.CREATOR_ETH_SHARE(), "%");

  console.log("\n🎯 Next Steps:");
  console.log("1. Update your .env.local with the new contract address:");
  console.log(`   NEXT_PUBLIC_CHAT_TOKEN_ADDRESS=${tokenAddress}`);
  console.log("2. Update frontend to use the new contract");
  console.log("3. Test ETH purchases and creator earnings");
  console.log("4. Creators can now earn both CHAT tokens AND ETH!");

  // Test purchase simulation
  console.log("\n🧪 Test Purchase Simulation:");
  const testEthAmount = ethers.parseEther("0.001"); // 0.001 ETH
  const chatQuote = await token.getChatTokenQuote(testEthAmount);
  console.log(`Purchasing ${ethers.formatEther(testEthAmount)} ETH would give ${ethers.formatEther(chatQuote)} CHAT tokens`);
  console.log(`Platform would receive: ${ethers.formatEther(testEthAmount * BigInt(70) / BigInt(100))} ETH (70%)`);
  console.log(`Creator pool would receive: ${ethers.formatEther(testEthAmount * BigInt(30) / BigInt(100))} ETH (30%)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
