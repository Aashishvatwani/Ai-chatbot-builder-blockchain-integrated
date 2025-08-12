// Decode transaction data to understand the failing call
const { ethers } = require('ethers');

// NEW transaction data from the latest error
const txData = "0x6a20de920000000000000000000000008861218f3bf122037828d3aa106e09d1d92f9499000000000000000000000000000000000000000000000000002386f26fc10000";

// Function signature 0x6a20de92 corresponds to processMessage(address,uint256)
console.log('🔍 Decoding NEW Transaction Data...\n');

// Remove the function selector (first 4 bytes)
const dataWithoutSelector = txData.slice(10);

// Decode the parameters
try {
  const decoded = ethers.utils.defaultAbiCoder.decode(
    ['address', 'uint256'], 
    '0x' + dataWithoutSelector
  );
  
  console.log('Function: processMessage(address user, uint256 chatbotId)');
  console.log('Parameters:');
  console.log(`  user: ${decoded[0]}`);
  console.log(`  chatbotId: ${decoded[1].toString()}`);
  console.log(`  chatbotId (hex): ${decoded[1].toHexString()}`);
  
  // Convert the chatbot ID to see what it represents
  const chatbotIdBN = ethers.BigNumber.from("0x002386f26fc10000");
  console.log(`\n💰 Chatbot ID as number: ${chatbotIdBN.toString()}`);
  console.log(`💰 Chatbot ID as ETH: ${ethers.utils.formatEther(chatbotIdBN)} ETH/CHAT`);
  
  console.log('\n🔍 Analysis:');
  console.log(`- The transaction is STILL calling processMessage() for chatbot ID ${decoded[1].toString()}`);
  console.log(`- This means the OLD CODE is still running!`);
  console.log(`- User: ${decoded[0]}`);
  console.log(`- The chatbot ID ${ethers.utils.formatEther(chatbotIdBN)} looks like 0.01 tokens as an ID`);
  
} catch (error) {
  console.error('Error decoding transaction data:', error);
}

console.log('\n❌ PROBLEM IDENTIFIED:');
console.log('1. The frontend is STILL calling processMessage() instead of directTokenTransfer()');
console.log('2. This suggests the browser cache is not cleared or the new code is not loaded');
console.log('3. The chatbot ID parameter seems to be 0.01 tokens worth (10000000000000000 wei)');

console.log('\n💡 SOLUTIONS:');
console.log('1. Hard refresh the browser (Ctrl+Shift+R)');
console.log('2. Clear browser cache completely');
console.log('3. Try incognito/private browsing mode');
console.log('4. Check if the dev server is running the latest code');
console.log('5. Look for "FIXED VERSION" logs in browser console');
