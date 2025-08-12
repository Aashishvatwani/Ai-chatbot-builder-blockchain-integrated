-- Hasura Relationship Tracking Commands
-- Run these commands in Hasura Console SQL tab or via Hasura CLI

-- 1. Track the relationships for conversation_payments table
-- Add object relationship from conversation_payments to chatbots
-- This will create a "chatbot" field in conversation_payments

-- 2. Add object relationship from conversation_payments to chat_sessions  
-- This will create a "chat_session" field in conversation_payments

-- 3. Add array relationship from chatbots to conversation_payments
-- This will create a "conversation_payments" field in chatbots

-- 4. Add array relationship from chat_sessions to conversation_payments
-- This will create a "conversation_payments" field in chat_sessions

-- 5. Add object relationship from blockchain_transactions to chatbots
-- This will create a "chatbot" field in blockchain_transactions

-- 6. Add array relationship from chatbots to blockchain_transactions
-- This will create a "blockchain_transactions" field in chatbots

-- 7. Add object relationship from chatbot_nfts to chatbots
-- This will create a "chatbot" field in chatbot_nfts

-- 8. Add array relationship from chatbots to chatbot_nfts
-- This will create a "chatbot_nfts" field in chatbots

-- After running the SQL above, you need to add these relationships in Hasura Console:
-- Go to Data > [table_name] > Relationships and add:

/*
For conversation_payments table:
- Object Relationship: chatbot -> chatbots(chatbot_id -> id)
- Object Relationship: chat_session -> chat_sessions(chat_session_id -> id)

For chatbots table:
- Array Relationship: conversation_payments -> conversation_payments(id -> chatbot_id)
- Array Relationship: blockchain_transactions -> blockchain_transactions(id -> chatbot_id)
- Array Relationship: chatbot_nfts -> chatbot_nfts(id -> chatbot_id)

For chat_sessions table:
- Array Relationship: conversation_payments -> conversation_payments(id -> chat_session_id)

For blockchain_transactions table:
- Object Relationship: chatbot -> chatbots(chatbot_id -> id)

For chatbot_nfts table:
- Object Relationship: chatbot -> chatbots(chatbot_id -> id)
*/
