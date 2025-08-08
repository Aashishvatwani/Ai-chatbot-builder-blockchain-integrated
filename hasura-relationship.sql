-- Set up the relationship between chatbots and chatbot_nfts tables
-- Run this in your Hasura Console → Data → SQL

-- Track the new table (if not auto-tracked)
-- This tells Hasura to include the table in the GraphQL schema

-- The relationship should be automatically detected, but if not:
-- 1. Go to Data → chatbots → Relationships
-- 2. Add Array Relationship:
--    - Name: chatbot_nfts  
--    - Reference: chatbot_nfts table
--    - From: id (chatbots.id)
--    - To: chatbot_id (chatbot_nfts.chatbot_id)

-- You can also set up the reverse relationship:
-- Go to Data → chatbot_nfts → Relationships
-- Add Object Relationship:
--    - Name: chatbot
--    - Reference: chatbots table  
--    - From: chatbot_id (chatbot_nfts.chatbot_id)
--    - To: id (chatbots.id)

-- Test query to verify the relationship works:
/*
query TestChatbotNFTs {
  chatbots(limit: 1) {
    id
    name
    chatbot_nfts {
      id
      token_id
      contract_address
      metadata_ipfs_hash
      image_ipfs_hash
      creator_address
      created_at
    }
  }
}
*/
