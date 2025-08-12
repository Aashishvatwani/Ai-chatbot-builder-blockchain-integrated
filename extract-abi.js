const fs = require('fs');
const path = require('path');

// Read the artifact file
const artifactPath = path.join(__dirname, 'artifacts/contracts/DailyRewardChatToken.sol/DailyRewardChatToken.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Extract just the ABI
const abi = artifact.abi;

// Write to the ABI file
const abiPath = path.join(__dirname, 'contracts/abis/ChatToken.json');
fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2), 'utf8');

console.log('✅ ABI extracted and saved to contracts/abis/ChatToken.json');
console.log(`📋 ABI contains ${abi.length} functions/events`);

// List some key functions
const functions = abi.filter(item => item.type === 'function').map(f => f.name);
console.log('📋 Key functions found:', functions.filter(f => f.includes('Daily') || f.includes('buy') || f.includes('claim')));
