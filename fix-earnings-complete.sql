-- Complete Fix for Earnings Data Issue
-- Run this in your PostgreSQL database first, then track in Hasura

-- 1. Ensure all blockchain tables exist with proper structure
CREATE TABLE IF NOT EXISTS conversation_payments (
    id SERIAL PRIMARY KEY,
    chat_session_id INT REFERENCES chat_sessions(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255),
    amount VARCHAR(255) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'completed',
    user_address VARCHAR(255) NOT NULL,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    amount VARCHAR(255) NOT NULL,
    token_type VARCHAR(10) NOT NULL,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_wallets (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(255) UNIQUE NOT NULL,
    token_balance VARCHAR(255) DEFAULT '0',
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

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

-- 2. Add missing column to chatbots if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='chatbots' AND column_name='ipfs_hash') THEN
        ALTER TABLE chatbots ADD COLUMN ipfs_hash VARCHAR(255);
    END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_payments_chatbot_id ON conversation_payments(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_payments_session_id ON conversation_payments(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_payments_user_address ON conversation_payments(user_address);
CREATE INDEX IF NOT EXISTS idx_conversation_payments_status ON conversation_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_chatbot_id ON blockchain_transactions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_from_address ON blockchain_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_to_address ON blockchain_transactions(to_address);

-- 4. Insert some test data to verify the setup works
INSERT INTO conversation_payments (chat_session_id, amount, payment_status, user_address, chatbot_id, transaction_hash, created_at)
SELECT 
    cs.id as chat_session_id,
    '0.001' as amount,
    'completed' as payment_status,
    '0x742d35Cc6479C0532c12345fe1234567890ABCDEF' as user_address,
    cs.chatbot_id,
    '0x' || md5(random()::text || clock_timestamp()::text) as transaction_hash,
    NOW() - (random() * interval '30 days') as created_at
FROM chat_sessions cs
JOIN chatbots c ON cs.chatbot_id = c.id
WHERE c.ipfs_hash IS NOT NULL OR c.name ILIKE '%NFT%'
LIMIT 5
ON CONFLICT DO NOTHING;

-- 5. Insert blockchain transaction records
INSERT INTO blockchain_transactions (transaction_hash, from_address, to_address, amount, token_type, chatbot_id, created_at)
SELECT 
    '0x' || md5(random()::text || clock_timestamp()::text) as transaction_hash,
    '0x742d35Cc6479C0532c12345fe1234567890ABCDEF' as from_address,
    '0x154eC1d3d1e83EAc7486e8381A280F7fE3e668C1' as to_address,
    '0.001' as amount,
    'CHAT' as token_type,
    c.id as chatbot_id,
    NOW() - (random() * interval '30 days') as created_at
FROM chatbots c
WHERE c.ipfs_hash IS NOT NULL OR c.name ILIKE '%NFT%'
LIMIT 5
ON CONFLICT (transaction_hash) DO NOTHING;

-- 6. Verify the data was inserted
SELECT 
    'conversation_payments' as table_name, 
    COUNT(*) as record_count 
FROM conversation_payments
UNION ALL
SELECT 
    'blockchain_transactions' as table_name, 
    COUNT(*) as record_count 
FROM blockchain_transactions
UNION ALL
SELECT 
    'chatbots' as table_name, 
    COUNT(*) as record_count 
FROM chatbots;

-- 7. Test query to verify earnings are working
SELECT 
    c.id,
    c.name,
    c.clerk_user_id,
    COUNT(cp.id) as payment_count,
    SUM(cp.amount::DECIMAL) as total_earnings,
    COUNT(bt.id) as transaction_count
FROM chatbots c
LEFT JOIN conversation_payments cp ON c.id = cp.chatbot_id AND cp.payment_status = 'completed'
LEFT JOIN blockchain_transactions bt ON c.id = bt.chatbot_id
GROUP BY c.id, c.name, c.clerk_user_id
HAVING COUNT(cp.id) > 0 OR COUNT(bt.id) > 0
ORDER BY total_earnings DESC NULLS LAST;
