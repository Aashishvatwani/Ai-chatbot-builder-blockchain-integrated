-- Add IPFS hash field to chatbots table
-- This allows chatbots to have optional IPFS metadata without requiring NFT tables

ALTER TABLE chatbots 
ADD COLUMN ipfs_hash VARCHAR(255) NULL;

-- Add comment for documentation
COMMENT ON COLUMN chatbots.ipfs_hash IS 'IPFS hash containing chatbot metadata (optional)';

-- Example of updating a chatbot with IPFS hash (replace with actual values)
-- UPDATE chatbots SET ipfs_hash = 'QmYourIPFSHashHere' WHERE id = 1;
