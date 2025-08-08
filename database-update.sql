-- Update schema to include chatbot_nfts table for NFT tracking
-- This should be run in your Neon database / Hasura console

-- Create chatbot_nfts table if it doesn't exist
CREATE TABLE IF NOT EXISTS chatbot_nfts (
    id SERIAL PRIMARY KEY,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE CASCADE,
    token_id VARCHAR(255) NOT NULL,
    contract_address VARCHAR(255) NOT NULL,
    metadata_ipfs_hash VARCHAR(255), -- IPFS hash for JSON metadata
    image_ipfs_hash VARCHAR(255),    -- IPFS hash for image file
    creator_address VARCHAR(255),    -- Wallet address of creator
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(token_id, contract_address)
);

-- Add some sample data for testing (optional)
-- INSERT INTO chatbot_nfts (chatbot_id, token_id, contract_address, metadata_ipfs_hash, image_ipfs_hash, creator_address) 
-- VALUES (1, '1', '0x5063a369B8ae4BbEC1C3fba44E77528b9bfc2802', 'QmSampleMetadataHash123', 'QmSampleImageHash456', '0x742d35Cc6634C0532925a3b8D...');

-- Grant permissions for Hasura (adjust role name as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON chatbot_nfts TO hasura;
-- GRANT USAGE, SELECT ON SEQUENCE chatbot_nfts_id_seq TO hasura;
