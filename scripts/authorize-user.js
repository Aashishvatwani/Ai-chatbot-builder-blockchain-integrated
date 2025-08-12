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

  // The user address from the error message
  const userAddress = "0x8861218f3bf122037828d3AA106e09d1D92F9499";
  
  console.log(`Authorizing user address: ${userAddress}`);

  try {
    // Check if already authorized
    const isAuthorized = await chatToken.authorizedSpenders(userAddress);
    
    if (!isAuthorized) {
      console.log(`Authorizing user ${userAddress}...`);
      const tx = await chatToken.authorizeSpender(userAddress, true);
      await tx.wait();
      console.log(`✅ User ${userAddress} authorized successfully`);
    } else {
      console.log(`ℹ️  User ${userAddress} already authorized`);
    }
  } catch (error) {
    console.error(`❌ Failed to authorize user ${userAddress}:`, error.message);
  }

  console.log("\n🎉 User authorization complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
