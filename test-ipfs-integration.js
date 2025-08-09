// Test script to check IPFS integration and database setup
// Run this with: node test-ipfs-integration.js

const testIPFSHash = "QmYourTestHashHere"; // Replace with actual IPFS hash

async function testIPFSFetch(hash) {
  try {
    console.log("🔍 Testing IPFS fetch with hash:", hash);
    
    const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
    console.log("📡 Fetching from URL:", url);
    
    const response = await fetch(url);
    console.log("📊 Response status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ IPFS data:", JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log("❌ Failed to fetch IPFS data");
      return null;
    }
  } catch (error) {
    console.error("🚫 Error:", error);
    return null;
  }
}

// Test metadata structure
const testMetadata = {
  "name": "AI ChatBot: Enhanced Test",
  "description": "A test NFT chatbot with advanced characteristics for customer support and creative conversations",
  "characteristics": ["friendly", "knowledgeable", "creative", "supportive"],
  "image": "https://gateway.pinata.cloud/ipfs/QmTest123...",
  "external_url": "https://example.com/chatbot/test",
  "attributes": [
    {
      "trait_type": "Personality",
      "value": "Friendly"
    },
    {
      "trait_type": "Expertise",
      "value": "Customer Support"
    },
    {
      "trait_type": "Language Skills",
      "value": "Multilingual"
    },
    {
      "trait_type": "Response Style",
      "value": "Conversational"
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "creator_address": "0x742d35Cc6634C0532925a3b8D...",
  "chatbot_id": 1
};

console.log("📋 Expected IPFS Metadata Structure:");
console.log(JSON.stringify(testMetadata, null, 2));

console.log("\n🤖 System Prompt that would be generated:");
const systemPrompt = `IPFS Enhanced Chatbot Profile:
- Name: ${testMetadata.name}
- Description: ${testMetadata.description}
- Creator Address: ${testMetadata.creator_address}
- Creation Date: ${testMetadata.created_at}
- Core IPFS Characteristics: ${testMetadata.characteristics.join(', ')}
- IPFS Attributes:
${testMetadata.attributes.map(attr => `  • ${attr.trait_type}: ${attr.value}`).join('\n')}

As an IPFS-enhanced chatbot, you embody the characteristics and attributes defined in your metadata.`;

console.log(systemPrompt);

console.log(`
🔧 DATABASE SETUP CHECKLIST:

1. Add ipfs_hash column to Neon database:
   ALTER TABLE chatbots ADD COLUMN ipfs_hash TEXT;

2. Refresh Hasura metadata (in Hasura console)

3. Test the GraphQL query in Hasura:
   query TestChatbotIPFS {
     chatbots(limit: 5) {
       id
       name
       ipfs_hash
       chatbot_characteristics {
         content
       }
     }
   }

4. Set an IPFS hash for testing:
   UPDATE chatbots SET ipfs_hash = 'YOUR_ACTUAL_IPFS_HASH' WHERE id = 1;

5. Test with a real IPFS hash by replacing 'QmYourTestHashHere' above

✅ Your current implementation should work once these steps are complete!
`);

// Test with actual IPFS hash if provided
if (process.argv[2]) {
  console.log("🧪 Testing with provided IPFS hash...");
  testIPFSFetch(process.argv[2]);
}
