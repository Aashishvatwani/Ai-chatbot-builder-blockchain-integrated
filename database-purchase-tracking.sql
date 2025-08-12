-- Database migration for purchase tracking and platform earnings
-- Add these tables to your Hasura database and track them

-- Table for tracking token purchases (ETH to CHAT)
CREATE TABLE IF NOT EXISTS token_purchases (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  eth_amount DECIMAL(18, 8) NOT NULL,
  chat_amount DECIMAL(18, 8) NOT NULL,
  transaction_hash VARCHAR(66) UNIQUE,
  purchase_type VARCHAR(20) DEFAULT 'ETH_TO_CHAT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking platform earnings from various sources
CREATE TABLE IF NOT EXISTS platform_earnings (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(30) NOT NULL, -- 'TOKEN_PURCHASE', 'MESSAGE_FEE', 'MARKETPLACE_FEE', etc.
  amount DECIMAL(18, 8) NOT NULL,
  currency VARCHAR(10) NOT NULL, -- 'ETH', 'CHAT', 'USD', etc.
  transaction_hash VARCHAR(66),
  user_address VARCHAR(42),
  chatbot_id INTEGER REFERENCES chatbots(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_token_purchases_user_address ON token_purchases(user_address);
CREATE INDEX IF NOT EXISTS idx_token_purchases_created_at ON token_purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_token_purchases_transaction_hash ON token_purchases(transaction_hash);

CREATE INDEX IF NOT EXISTS idx_platform_earnings_source_type ON platform_earnings(source_type);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_created_at ON platform_earnings(created_at);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_user_address ON platform_earnings(user_address);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_chatbot_id ON platform_earnings(chatbot_id);

-- Add update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_token_purchases_updated_at 
    BEFORE UPDATE ON token_purchases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_earnings_updated_at 
    BEFORE UPDATE ON platform_earnings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO token_purchases (user_address, eth_amount, chat_amount, transaction_hash, purchase_type) VALUES
-- ('0x1234567890123456789012345678901234567890', 0.001, 10.0, '0x123abc...', 'ETH_TO_CHAT'),
-- ('0x2345678901234567890123456789012345678901', 0.005, 50.0, '0x456def...', 'ETH_TO_CHAT'),
-- ('0x3456789012345678901234567890123456789012', 0.01, 100.0, '0x789ghi...', 'ETH_TO_CHAT');

-- INSERT INTO platform_earnings (source_type, amount, currency, user_address) VALUES
-- ('TOKEN_PURCHASE', 0.001, 'ETH', '0x1234567890123456789012345678901234567890'),
-- ('TOKEN_PURCHASE', 0.005, 'ETH', '0x2345678901234567890123456789012345678901'),
-- ('TOKEN_PURCHASE', 0.01, 'ETH', '0x3456789012345678901234567890123456789012');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON token_purchases TO hasura;
-- GRANT ALL PRIVILEGES ON platform_earnings TO hasura;
-- GRANT USAGE, SELECT ON SEQUENCE token_purchases_id_seq TO hasura;
-- GRANT USAGE, SELECT ON SEQUENCE platform_earnings_id_seq TO hasura;
