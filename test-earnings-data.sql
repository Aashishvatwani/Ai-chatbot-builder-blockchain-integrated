-- Test Earnings Data Flow
-- This script will help you debug why earnings aren't showing up

-- 1. Check if chatbots exist for your user
SELECT 'Your Chatbots:' as info;
SELECT id, name, clerk_user_id, created_at 
FROM chatbots 
WHERE clerk_user_id = 'YOUR_CLERK_USER_ID_HERE'  -- Replace with your actual clerk user ID
ORDER BY created_at DESC;

-- 2. Check if there are any conversation payments
SELECT 'All Conversation Payments:' as info;
SELECT 
    cp.id,
    cp.chatbot_id,
    cp.chat_session_id,
    cp.amount,
    cp.payment_status,
    cp.user_address,
    cp.transaction_hash,
    cp.created_at,
    c.name as chatbot_name,
    c.clerk_user_id
FROM conversation_payments cp
LEFT JOIN chatbots c ON cp.chatbot_id = c.id
ORDER BY cp.created_at DESC
LIMIT 20;

-- 3. Check if there are any blockchain transactions
SELECT 'All Blockchain Transactions:' as info;
SELECT 
    bt.id,
    bt.chatbot_id,
    bt.transaction_hash,
    bt.amount,
    bt.token_type,
    bt.from_address,
    bt.to_address,
    bt.created_at,
    c.name as chatbot_name
FROM blockchain_transactions bt
LEFT JOIN chatbots c ON bt.chatbot_id = c.id
ORDER BY bt.created_at DESC
LIMIT 20;

-- 4. Check chat sessions and messages
SELECT 'Recent Chat Sessions:' as info;
SELECT 
    cs.id as session_id,
    cs.chatbot_id,
    cs.guest_id,
    cs.created_at,
    c.name as chatbot_name,
    COUNT(m.id) as message_count
FROM chat_sessions cs
LEFT JOIN chatbots c ON cs.chatbot_id = c.id
LEFT JOIN messages m ON cs.id = m.chat_session_id
WHERE c.clerk_user_id = 'YOUR_CLERK_USER_ID_HERE'  -- Replace with your actual clerk user ID
GROUP BY cs.id, cs.chatbot_id, cs.guest_id, cs.created_at, c.name
ORDER BY cs.created_at DESC
LIMIT 10;

-- 5. Check if payments are linked to your chatbots
SELECT 'Payments for Your Chatbots:' as info;
SELECT 
    cp.id,
    cp.amount,
    cp.payment_status,
    cp.created_at,
    c.name as chatbot_name,
    c.clerk_user_id
FROM conversation_payments cp
JOIN chatbots c ON cp.chatbot_id = c.id
WHERE c.clerk_user_id = 'YOUR_CLERK_USER_ID_HERE'  -- Replace with your actual clerk user ID
ORDER BY cp.created_at DESC;

-- 6. Summary counts
SELECT 'Summary Counts:' as info;
SELECT 
    'chatbots' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN clerk_user_id = 'YOUR_CLERK_USER_ID_HERE' THEN 1 END) as user_count
FROM chatbots

UNION ALL

SELECT 
    'conversation_payments' as table_name,
    COUNT(*) as total_count,
    (SELECT COUNT(*) 
     FROM conversation_payments cp 
     JOIN chatbots c ON cp.chatbot_id = c.id 
     WHERE c.clerk_user_id = 'YOUR_CLERK_USER_ID_HERE') as user_count

UNION ALL

SELECT 
    'blockchain_transactions' as table_name,
    COUNT(*) as total_count,
    (SELECT COUNT(*) 
     FROM blockchain_transactions bt 
     JOIN chatbots c ON bt.chatbot_id = c.id 
     WHERE c.clerk_user_id = 'YOUR_CLERK_USER_ID_HERE') as user_count

UNION ALL

SELECT 
    'chat_sessions' as table_name,
    COUNT(*) as total_count,
    (SELECT COUNT(*) 
     FROM chat_sessions cs 
     JOIN chatbots c ON cs.chatbot_id = c.id 
     WHERE c.clerk_user_id = 'YOUR_CLERK_USER_ID_HERE') as user_count;

-- 7. Check table structures
SELECT 'conversation_payments structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'conversation_payments' 
ORDER BY ordinal_position;

-- 8. Check for any data integrity issues
SELECT 'Data Integrity Check:' as info;
SELECT 
    'conversation_payments with invalid chatbot_id' as issue,
    COUNT(*) as count
FROM conversation_payments cp
LEFT JOIN chatbots c ON cp.chatbot_id = c.id
WHERE cp.chatbot_id IS NOT NULL AND c.id IS NULL

UNION ALL

SELECT 
    'conversation_payments with invalid chat_session_id' as issue,
    COUNT(*) as count
FROM conversation_payments cp
LEFT JOIN chat_sessions cs ON cp.chat_session_id = cs.id
WHERE cp.chat_session_id IS NOT NULL AND cs.id IS NULL;
