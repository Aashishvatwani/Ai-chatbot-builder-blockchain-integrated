-- Test data for purchase tracking tables
-- Run this after creating the tables to test the earnings dashboard

-- Sample token purchases (last 7 days)
INSERT INTO token_purchases (user_address, eth_amount, chat_amount, transaction_hash, purchase_type, created_at) VALUES
('0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', 0.001, 10.0, '0xtest001', 'ETH_TO_CHAT', NOW() - INTERVAL '1 day'),
('0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', 0.005, 50.0, '0xtest002', 'ETH_TO_CHAT', NOW() - INTERVAL '2 days'),
('0x123456789012345678901234567890123456789A', 0.01, 100.0, '0xtest003', 'ETH_TO_CHAT', NOW() - INTERVAL '3 days'),
('0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', 0.002, 20.0, '0xtest004', 'ETH_TO_CHAT', NOW() - INTERVAL '4 days'),
('0x987654321098765432109876543210987654321B', 0.0015, 15.0, '0xtest005', 'ETH_TO_CHAT', NOW() - INTERVAL '5 days'),
('0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', 0.003, 30.0, '0xtest006', 'ETH_TO_CHAT', NOW() - INTERVAL '6 days');

-- Sample platform earnings from token purchases
INSERT INTO platform_earnings (source_type, amount, currency, transaction_hash, user_address, created_at) VALUES
('TOKEN_PURCHASE', 0.001, 'ETH', '0xtest001', '0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', NOW() - INTERVAL '1 day'),
('TOKEN_PURCHASE', 0.005, 'ETH', '0xtest002', '0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', NOW() - INTERVAL '2 days'),
('TOKEN_PURCHASE', 0.01, 'ETH', '0xtest003', '0x123456789012345678901234567890123456789A', NOW() - INTERVAL '3 days'),
('TOKEN_PURCHASE', 0.002, 'ETH', '0xtest004', '0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', NOW() - INTERVAL '4 days'),
('TOKEN_PURCHASE', 0.0015, 'ETH', '0xtest005', '0x987654321098765432109876543210987654321B', NOW() - INTERVAL '5 days'),
('TOKEN_PURCHASE', 0.003, 'ETH', '0xtest006', '0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', NOW() - INTERVAL '6 days');

-- Sample message-based earnings (conversation_payments)
INSERT INTO conversation_payments (chatbot_id, amount, payment_status, user_address, transaction_hash, created_at) VALUES
(1, 0.0008, 'completed', '0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', '0xmsg001', NOW() - INTERVAL '1 day'),
(1, 0.0008, 'completed', '0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', '0xmsg002', NOW() - INTERVAL '1 day'),
(2, 0.0008, 'completed', '0x123456789012345678901234567890123456789A', '0xmsg003', NOW() - INTERVAL '2 days'),
(1, 0.0008, 'completed', '0x742d35Cc0A76Eb92B3c8c4A8EEaEF0dDc7E1f8c2', '0xmsg004', NOW() - INTERVAL '3 days'),
(3, 0.0008, 'completed', '0x987654321098765432109876543210987654321B', '0xmsg005', NOW() - INTERVAL '4 days');

-- Check the data
SELECT 'Token Purchases' as table_name, COUNT(*) as count FROM token_purchases
UNION ALL
SELECT 'Platform Earnings' as table_name, COUNT(*) as count FROM platform_earnings
UNION ALL
SELECT 'Conversation Payments' as table_name, COUNT(*) as count FROM conversation_payments;

-- Show recent purchases
SELECT 
    tp.user_address,
    tp.eth_amount,
    tp.chat_amount,
    tp.created_at,
    pe.amount as platform_eth_earned
FROM token_purchases tp
LEFT JOIN platform_earnings pe ON tp.transaction_hash = pe.transaction_hash
ORDER BY tp.created_at DESC
LIMIT 10;
