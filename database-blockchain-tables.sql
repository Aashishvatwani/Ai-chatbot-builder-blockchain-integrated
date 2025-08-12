-- Blockchain Integration Database Migration
-- This creates all the necessary tables for NFT chatbot functionality

-- NFT tracking table
CREATE TABLE IF NOT EXISTS chatbot_nfts (
    id SERIAL PRIMARY KEY,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE CASCADE,
    token_id VARCHAR(255) NOT NULL,
    contract_address VARCHAR(255) NOT NULL,
    minted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata_uri TEXT,
    ipfs_hash VARCHAR(255),
    UNIQUE(token_id, contract_address)
);

-- User wallet information
CREATE TABLE IF NOT EXISTS user_wallets (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(255) UNIQUE NOT NULL,
    token_balance VARCHAR(255) DEFAULT '0',
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Blockchain transaction tracking
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    amount VARCHAR(255) NOT NULL,
    token_type VARCHAR(10) NOT NULL, -- 'CHAT', 'ETH', etc.
    chatbot_id INT REFERENCES chatbots(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Conversation payments
CREATE TABLE IF NOT EXISTS conversation_payments (
    id SERIAL PRIMARY KEY,
    chat_session_id INT REFERENCES chat_sessions(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255),
    amount VARCHAR(255) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    user_address VARCHAR(255) NOT NULL,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatbot_nfts_chatbot_id ON chatbot_nfts(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_nfts_token_id ON chatbot_nfts(token_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(user_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_txn_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_txn_chatbot ON blockchain_transactions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_payments_session ON conversation_payments(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_payments_user ON conversation_payments(user_address);

-- Add triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE chatbot_nfts IS 'Tracks NFT tokens for chatbots';
COMMENT ON TABLE user_wallets IS 'Stores user wallet addresses and token balances';
COMMENT ON TABLE blockchain_transactions IS 'Records all blockchain transactions related to chatbots';
COMMENT ON TABLE conversation_payments IS 'Tracks payments for chatbot conversations';

-- Sample data for testing (optional)
-- INSERT INTO user_wallets (user_address, token_balance) 
-- VALUES ('0x742d35Cc6479C0532c12345fe1234567890ABCDEF', '100.0')
-- ON CONFLICT (user_address) DO NOTHING;
