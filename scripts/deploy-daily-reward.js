const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of DailyRewardChatToken...");

  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Deploy DailyRewardChatToken
  const DailyRewardChatToken = await hre.ethers.getContractFactory("DailyRewardChatToken");
  const token = await DailyRewardChatToken.deploy(deployer.address);
  await token.deployed();
  console.log("DailyRewardChatToken deployed to:", token.address);

  // Mint initial tokens to deployer for testing
  const initialMintAmount = hre.ethers.utils.parseEther("10000"); // 10,000 tokens
  await token.mintRewards(deployer.address, initialMintAmount);
  console.log("Minted initial tokens to deployer");

  console.log("\n=== Deployment Summary ===");
  console.log("DailyRewardChatToken Address:", token.address);
  console.log("Deployer Address:", deployer.address);

  console.log("\n=== Next Steps ===");
  console.log("1. Update your .env.local with the contract address");
  console.log("2. Verify contract on Etherscan");
  console.log("3. Update your frontend configuration");

  console.log("\n=== Environment Variable ===");
  console.log(`NEXT_PUBLIC_CHAT_TOKEN_ADDRESS=${token.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
