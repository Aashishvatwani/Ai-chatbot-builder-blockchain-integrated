-- Add IPFS hash field directly to chatbots table for simple IPFS metadata access
-- This approach avoids creating separate NFT tables

-- Add IPFS hash column to existing chatbots table
ALTER TABLE chatbots ADD COLUMN ipfs_hash TEXT;

-- Optional: Add sample IPFS hash for testing
-- UPDATE chatbots SET ipfs_hash = 'QmYourIPFSHashHere' WHERE id = 1;

-- The ipfs_hash field will store the IPFS hash containing chatbot metadata
-- Format expected: QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
