-- Fix Missing Relationships for Earnings Data
-- This SQL will establish proper foreign key relationships and Hasura tracking

-- 1. First, let's ensure the foreign key constraints exist
-- Add foreign key from conversation_payments to chatbots (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversation_payments_chatbot_id_fkey'
    ) THEN
        ALTER TABLE conversation_payments 
        ADD CONSTRAINT conversation_payments_chatbot_id_fkey 
        FOREIGN KEY (chatbot_id) REFERENCES chatbots(id);
    END IF;
END $$;

-- Add foreign key from conversation_payments to chat_sessions (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversation_payments_chat_session_id_fkey'
    ) THEN
        ALTER TABLE conversation_payments 
        ADD CONSTRAINT conversation_payments_chat_session_id_fkey 
        FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id);
    END IF;
END $$;

-- Add foreign key from blockchain_transactions to chatbots (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'blockchain_transactions_chatbot_id_fkey'
    ) THEN
        ALTER TABLE blockchain_transactions 
        ADD CONSTRAINT blockchain_transactions_chatbot_id_fkey 
        FOREIGN KEY (chatbot_id) REFERENCES chatbots(id);
    END IF;
END $$;

-- Add foreign key from chatbot_nfts to chatbots (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chatbot_nfts_chatbot_id_fkey'
    ) THEN
        ALTER TABLE chatbot_nfts 
        ADD CONSTRAINT chatbot_nfts_chatbot_id_fkey 
        FOREIGN KEY (chatbot_id) REFERENCES chatbots(id);
    END IF;
END $$;

-- 2. Now let's create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_payments_chatbot_id 
ON conversation_payments(chatbot_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_payments_chat_session_id 
ON conversation_payments(chat_session_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_payments_user_address 
ON conversation_payments(user_address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_payments_status 
ON conversation_payments(payment_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blockchain_transactions_chatbot_id 
ON blockchain_transactions(chatbot_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blockchain_transactions_addresses 
ON blockchain_transactions(from_address, to_address);

-- 3. Verify current relationships
SELECT 
    'conversation_payments' as table_name,
    count(*) as total_records,
    count(CASE WHEN chatbot_id IS NOT NULL THEN 1 END) as with_chatbot_id,
    count(CASE WHEN chat_session_id IS NOT NULL THEN 1 END) as with_session_id
FROM conversation_payments

UNION ALL

SELECT 
    'blockchain_transactions' as table_name,
    count(*) as total_records,
    count(CASE WHEN chatbot_id IS NOT NULL THEN 1 END) as with_chatbot_id,
    0 as with_session_id
FROM blockchain_transactions;

-- 4. Sample some data to verify structure
SELECT 'conversation_payments sample:' as info;
SELECT id, chatbot_id, chat_session_id, amount, payment_status, created_at 
FROM conversation_payments 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'blockchain_transactions sample:' as info;
SELECT id, chatbot_id, transaction_hash, amount, token_type, created_at 
FROM blockchain_transactions 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'chatbots sample:' as info;
SELECT id, name, clerk_user_id, created_at 
FROM chatbots 
ORDER BY created_at DESC 
LIMIT 5;
