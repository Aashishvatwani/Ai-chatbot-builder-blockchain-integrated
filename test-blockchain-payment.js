// Test blockchain payment functionality
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// Contract ABIs
const ChatTokenABI = require('./contracts/abis/ChatToken.json');

// Contract addresses from environment
const CHAT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CHAT_TOKEN_ADDRESS;

async function testBlockchainPayment() {
  try {
    console.log('🧪 Testing Blockchain Payment System...\n');
    
    // Check if we have the required environment variables
    if (!CHAT_TOKEN_ADDRESS) {
      throw new Error('NEXT_PUBLIC_CHAT_TOKEN_ADDRESS not found in environment variables');
    }
    
    console.log('📋 Configuration:');
    console.log(`   Token Contract: ${CHAT_TOKEN_ADDRESS}`);
    console.log(`   Network: Sepolia Testnet (${process.env.NEXT_PUBLIC_NETWORK_ID})`);
    
    // Connect to the blockchain (read-only for testing)
    const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_INFURA_KEY');
    
    // Create contract instance (read-only)
    const chatTokenContract = new ethers.Contract(
      CHAT_TOKEN_ADDRESS,
      ChatTokenABI,
      provider
    );
    
    console.log('\n🔍 Checking Contract Information...');
    
    // 1. Check basic contract info
    try {
      const name = await chatTokenContract.name();
      const symbol = await chatTokenContract.symbol();
      const decimals = await chatTokenContract.decimals();
      const totalSupply = await chatTokenContract.totalSupply();
      
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Decimals: ${decimals}`);
      console.log(`   Total Supply: ${ethers.utils.formatEther(totalSupply)} ${symbol}`);
    } catch (error) {
      console.error('❌ Error fetching basic contract info:', error.message);
      return;
    }
    
    // 2. Check contract constants
    try {
      const messageCost = await chatTokenContract.MESSAGE_COST();
      const creatorReward = await chatTokenContract.CREATOR_REWARD();
      const platformFee = await chatTokenContract.PLATFORM_FEE();
      
      console.log(`\n💰 Payment Structure:`);
      console.log(`   Message Cost: ${ethers.utils.formatEther(messageCost)} CHAT`);
      console.log(`   Creator Reward: ${ethers.utils.formatEther(creatorReward)} CHAT`);
      console.log(`   Platform Fee: ${ethers.utils.formatEther(platformFee)} CHAT`);
    } catch (error) {
      console.error('❌ Error fetching payment constants:', error.message);
    }
    
    // 3. Check contract owner and authorized spenders
    try {
      const owner = await chatTokenContract.owner();
      console.log(`\n👑 Contract Owner: ${owner}`);
      
      // Test a few sample addresses for authorization
      const testAddresses = [
        '0x8861218f3bf122037828d3AA106e09d1D92F9499', // The address from the error
        owner // Contract owner
      ];
      
      console.log('\n🔐 Authorization Status:');
      for (const address of testAddresses) {
        try {
          const isAuthorized = await chatTokenContract.authorizedSpenders(address);
          console.log(`   ${address}: ${isAuthorized ? '✅ Authorized' : '❌ Not Authorized'}`);
        } catch (error) {
          console.log(`   ${address}: ❓ Error checking authorization`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking owner/authorization:', error.message);
    }
    
    // 4. Test chatbot registration
    const testChatbotId = 1;
    try {
      const chatbotOwner = await chatTokenContract.chatbotOwners(testChatbotId);
      console.log(`\n🤖 Chatbot ${testChatbotId} Registration:`);
      
      if (chatbotOwner === ethers.constants.AddressZero) {
        console.log(`   ❌ Chatbot ${testChatbotId} is NOT registered in the contract`);
        console.log(`   💡 This means the processMessage function will fail`);
        console.log(`   📝 Recommendation: Use direct transfer method instead`);
      } else {
        console.log(`   ✅ Chatbot ${testChatbotId} is registered`);
        console.log(`   👤 Owner: ${chatbotOwner}`);
      }
    } catch (error) {
      console.error('❌ Error checking chatbot registration:', error.message);
    }
    
    console.log('\n🔧 Payment Method Recommendations:');
    console.log('   1. For registered chatbots with authorized users: Use processMessage()');
    console.log('   2. For unregistered chatbots: Use direct transfer() to platform');
    console.log('   3. Fixed cost approach: Use 0.001 CHAT for better UX');
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Register chatbots in the contract using register-chatbots.js');
    console.log('   2. Or continue using the direct transfer approach');
    console.log('   3. The updated code now handles both cases gracefully');
    
    console.log('\n✅ Blockchain payment test completed!');
    
  } catch (error) {
    console.error('❌ Error testing blockchain payment:', error.message);
  }
}

// Export for use in other scripts
module.exports = { testBlockchainPayment };

// Run if called directly
if (require.main === module) {
  testBlockchainPayment().then(() => {
    console.log('\n🎯 Test complete!');
    process.exit(0);
  }).catch(console.error);
}
