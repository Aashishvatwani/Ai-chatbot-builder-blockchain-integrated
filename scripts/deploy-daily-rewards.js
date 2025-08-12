const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying DailyRewardChatToken...");

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📋 Deploying from account:", deployer.address);
    
    // Get account balance
    const balance = await deployer.getBalance();
    console.log("📋 Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

    // Deploy the contract
    const DailyRewardChatToken = await hre.ethers.getContractFactory("DailyRewardChatToken");
    const chatToken = await DailyRewardChatToken.deploy(deployer.address);

    await chatToken.deployed();

    console.log("✅ DailyRewardChatToken deployed to:", chatToken.address);
    
    // Display contract features
    const dailyLimits = await chatToken.getDailyLimits();
    const purchaseInfo = await chatToken.getPurchaseInfo();
    
    console.log("📋 Daily free messages:", dailyLimits.freeMessages.toString());
    console.log("📋 Daily claim amount:", hre.ethers.utils.formatEther(dailyLimits.claimAmount), "CHAT");
    console.log("📋 ETH to CHAT rate:", purchaseInfo.rate.toString(), "CHAT per ETH");
    console.log("📋 Minimum ETH purchase:", hre.ethers.utils.formatEther(purchaseInfo.minPurchase), "ETH");
    console.log("📋 Platform address (receives ETH):", purchaseInfo.platformAddress);
    
    // Get initial supply
    const totalSupply = await chatToken.totalSupply();
    console.log("📋 Total supply:", hre.ethers.utils.formatEther(totalSupply), "CHAT");
    
    // Authorize the deployer as spender
    console.log("🔧 Authorizing deployer as spender...");
    const authTx = await chatToken.authorizeSpender(deployer.address);
    await authTx.wait();
    console.log("✅ Deployer authorized");

    // Register some test chatbots
    console.log("🤖 Registering test chatbots...");
    const chatbotIds = [34, 35, 36, 37, 38, 39, 40];
    
    for (const id of chatbotIds) {
        const tx = await chatToken.registerChatbot(id, deployer.address);
        await tx.wait();
        console.log(`✅ Registered chatbot ${id}`);
    }

    console.log("\n🎉 Deployment Summary:");
    console.log(`📋 Contract Address: ${chatToken.address}`);
    console.log(`📋 Network: ${hre.network.name}`);
    console.log(`📋 Features:`);
    console.log(`   • ${dailyLimits.freeMessages} free messages per user per day`);
    console.log(`   • ${hre.ethers.utils.formatEther(dailyLimits.claimAmount)} CHAT daily claim reward`);
    console.log(`   • ETH to CHAT purchase: ${purchaseInfo.rate} CHAT per ETH`);
    console.log(`   • Minimum purchase: ${hre.ethers.utils.formatEther(purchaseInfo.minPurchase)} ETH`);
    console.log(`   • All ETH goes to: ${purchaseInfo.platformAddress}`);
    console.log(`   • Automatic daily reset`);
    console.log(`   • Creator rewards for all messages`);
    
    console.log("\n🔧 Next Steps:");
    console.log("1. Update your frontend to use this new contract address");
    console.log("2. Users can claim daily rewards without needing owner permission");
    console.log("3. Users get 5 free messages per day automatically");
    console.log("4. Users can buy CHAT tokens with ETH (all ETH goes to platform address)");
    console.log("5. After free messages, users need CHAT tokens to continue messaging");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
