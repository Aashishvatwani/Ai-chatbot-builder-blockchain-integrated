const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Deploy ChatToken first
  console.log("Deploying ChatToken...");
  const ChatToken = await hre.ethers.getContractFactory("ChatToken");
  const chatToken = await ChatToken.deploy();
  await chatToken.deployed();
  console.log("ChatToken deployed to:", chatToken.address);

  // Deploy ChatbotNFT
  console.log("Deploying ChatbotNFT...");
  const ChatbotNFT = await hre.ethers.getContractFactory("ChatbotNFT");
  const chatbotNFT = await ChatbotNFT.deploy();
  await chatbotNFT.deployed();
  console.log("ChatbotNFT deployed to:", chatbotNFT.address);

  // Set up initial configuration
  console.log("Setting up initial configuration...");
  
  // Authorize the backend server to spend tokens
  const backendAddress = process.env.BACKEND_WALLET_ADDRESS;
  if (backendAddress) {
    await chatToken.authorizeSpender(backendAddress, true);
    console.log("Authorized backend wallet for token spending");
  }

  // Mint initial tokens to deployer for testing
  const deployer = await hre.ethers.getSigner();
  const initialMintAmount = hre.ethers.utils.parseEther("10000"); // 10,000 tokens
  await chatToken.mintRewards(deployer.address, initialMintAmount);
  console.log("Minted initial tokens to deployer");

  console.log("\n=== Deployment Summary ===");
  console.log("ChatToken Address:", chatToken.address);
  console.log("ChatbotNFT Address:", chatbotNFT.address);
  console.log("Deployer Address:", deployer.address);
  
  console.log("\n=== Next Steps ===");
  console.log("1. Update your .env.local with the contract addresses");
  console.log("2. Verify contracts on Etherscan");
  console.log("3. Update your frontend configuration");
  
  console.log("\n=== Environment Variables ===");
  console.log(`NEXT_PUBLIC_CHAT_TOKEN_ADDRESS=${chatToken.address}`);
  console.log(`NEXT_PUBLIC_CHATBOT_NFT_ADDRESS=${chatbotNFT.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
