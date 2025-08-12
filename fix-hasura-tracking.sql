-- Fix Hasura Tracking and Relationships for Blockchain Tables
-- Run this in your Hasura Console → Data → SQL
-- OR use Hasura CLI: hasura metadata apply

-- 1. Track all blockchain tables (if not already tracked)
-- You may need to do this manually in Hasura Console → Data → Track All

-- 2. Set up relationships for conversation_payments table

-- Add object relationship: conversation_payments.chatbot → chatbots
-- This allows: conversation_payments { chatbot { id, name } }
ALTER TABLE conversation_payments 
ADD CONSTRAINT fk_conversation_payments_chatbot 
FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE SET NULL;

-- Add object relationship: conversation_payments.chat_session → chat_sessions  
-- This allows: conversation_payments { chat_session { id } }
ALTER TABLE conversation_payments 
ADD CONSTRAINT fk_conversation_payments_session 
FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;

-- 3. Set up array relationships on main tables

-- For chatbots table: Add array relationship to conversation_payments
-- This allows: chatbots { conversation_payments { amount, created_at } }
-- This relationship should be set up in Hasura Console:
-- Go to Data → chatbots → Relationships → Add Array Relationship
-- Name: conversation_payments
-- Reference Table: conversation_payments  
-- From: id (chatbots.id)
-- To: chatbot_id (conversation_payments.chatbot_id)

-- For chat_sessions table: Add array relationship to conversation_payments
-- This allows: chat_sessions { conversation_payments { amount } }
-- Go to Data → chat_sessions → Relationships → Add Array Relationship
-- Name: conversation_payments
-- Reference Table: conversation_payments
-- From: id (chat_sessions.id) 
-- To: chat_session_id (conversation_payments.chat_session_id)

-- 4. Set up other blockchain table relationships

-- chatbot_nfts → chatbots relationship
ALTER TABLE chatbot_nfts 
ADD CONSTRAINT fk_chatbot_nfts_chatbot 
FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE;

-- blockchain_transactions → chatbots relationship  
ALTER TABLE blockchain_transactions 
ADD CONSTRAINT fk_blockchain_transactions_chatbot 
FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE SET NULL;

-- 5. Verify tables are tracked
-- Run this query to test if relationships work:
/*
query TestBlockchainRelationships {
  chatbots(limit: 1) {
    id
    name
    conversation_payments {
      id
      amount
      created_at
    }
    chatbot_nfts {
      id
      token_id
    }
  }
  conversation_payments(limit: 5) {
    id
    amount
    chatbot {
      id
      name
    }
    chat_session {
      id
    }
  }
}
*/

-- 6. Update GraphQL schema
-- After running this, you need to:
-- 1. Go to Hasura Console → Data 
-- 2. Click "Track All" for any untracked tables
-- 3. Set up the array relationships manually as described above
-- 4. Test with the query above

-- Note: If using Hasura Cloud/Enterprise, you can also use metadata to automate this:
-- hasura metadata export
-- Edit the metadata files to include relationships  
-- hasura metadata apply
