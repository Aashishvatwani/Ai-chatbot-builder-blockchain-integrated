const { ethers } = require('hardhat');

async function main() {
  // Get the deployed contract addresses
  const CHAT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CHAT_TOKEN_ADDRESS || "0x154eC1d3d1e83EAc7486e8381A280F7fE3e668C1";
  
  // Get the signer (contract owner)
  const [owner] = await ethers.getSigners();
  console.log("Using account:", owner.address);

  // Connect to the deployed ChatToken contract
  const ChatToken = await ethers.getContractFactory("ChatToken");
  const chatToken = ChatToken.attach(CHAT_TOKEN_ADDRESS);

  // Register chatbot ID 9 (and other common IDs) for testing
  const chatbotIdsToRegister = [9, 1, 2, 3, 4, 5, 55, 34, 35, 36, 37, 38, 39, 40]; // Add more common IDs
  const testCreatorAddress = "0x37700500A14540Ba973d98FE76bdb1c7aC6327A4"; // Your test address

  console.log(`Registering chatbots for creator: ${testCreatorAddress}`);

  for (const chatbotId of chatbotIdsToRegister) {
    try {
      // Check if already registered
      const currentOwner = await chatToken.chatbotOwners(chatbotId);
      
      if (currentOwner === ethers.constants.AddressZero) {
        console.log(`Registering chatbot ${chatbotId}...`);
        const tx = await chatToken.setChatbotOwner(chatbotId, testCreatorAddress);
        await tx.wait();
        console.log(`✅ Chatbot ${chatbotId} registered successfully`);
      } else {
        console.log(`ℹ️  Chatbot ${chatbotId} already registered to: ${currentOwner}`);
      }
    } catch (error) {
      console.error(`❌ Failed to register chatbot ${chatbotId}:`, error.message);
    }
  }

  // Also authorize the contract to spend tokens on behalf of users
  console.log("\nSetting up contract authorizations...");
  try {
    const isAuthorized = await chatToken.authorizedSpenders(CHAT_TOKEN_ADDRESS);
    if (!isAuthorized) {
      const tx = await chatToken.authorizeSpender(CHAT_TOKEN_ADDRESS, true);
      await tx.wait();
      console.log("✅ Contract authorized as spender");
    } else {
      console.log("ℹ️  Contract already authorized as spender");
    }
  } catch (error) {
    console.error("❌ Failed to authorize contract:", error.message);
  }

  console.log("\n🎉 Setup complete! You can now test payments with the registered chatbots.");
  console.log(`📝 Test with chatbot IDs: ${chatbotIdsToRegister.join(', ')}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
