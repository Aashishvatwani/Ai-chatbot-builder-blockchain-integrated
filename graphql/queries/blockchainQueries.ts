import { gql } from "@apollo/client";

export const GET_CHATBOT_NFT_DATA = gql`
  query GetChatbotNFTData($chatbot_id: Int!, $skip_nfts: Boolean = true) {
    chatbot_nfts(where: { chatbot_id: { _eq: $chatbot_id } }) @skip(if: $skip_nfts) {
      id
      token_id
      contract_address
      minted_at
    }
    chatbots(where: { id: { _eq: $chatbot_id } }) {
      id
      name
      chatbot_characteristics {
        content
      }
    }
  }
`;

// Get earnings for a specific chatbot
export const GET_CHATBOT_EARNINGS = gql`
  query GetChatbotEarnings($chatbot_id: Int!) {
    conversation_payments(
      where: { 
        chatbot_id: { _eq: $chatbot_id },
        payment_status: { _eq: "completed" }
      },
      order_by: { created_at: desc }
    ) {
      id
      amount
      created_at
      user_address
      transaction_hash
      chat_session_id
    }
  }
`;

// Get all earnings for a user's chatbots - Fixed to work without relationships
export const GET_USER_CHATBOT_EARNINGS = gql`
  query GetUserChatbotEarnings($user_id: String!) {
    chatbots(where: { clerk_user_id: { _eq: $user_id } }) {
      id
      name
    }
  }
`;

// Test query to check if blockchain tables exist
export const TEST_BLOCKCHAIN_TABLES = gql`
  query TestBlockchainTables {
    __schema {
      queryType {
        fields {
          name
        }
      }
    }
  }
`;

// Separate query for conversation payments - Try to fetch, fallback if not available
export const GET_USER_CONVERSATION_PAYMENTS = gql`
  query GetUserConversationPayments($chatbot_ids: [Int!]) {
    conversation_payments(
      where: { 
        payment_status: { _eq: "completed" },
        chatbot_id: { _in: $chatbot_ids }
      },
      order_by: { created_at: desc }
    ) {
      id
      amount
      created_at
      user_address
      transaction_hash
      chatbot_id
    }
  }
`;

// Get blockchain transactions for a user - Safe version
export const GET_BLOCKCHAIN_TRANSACTIONS = gql`
  query GetBlockchainTransactions($user_address: String, $skip_transactions: Boolean = true) {
    blockchain_transactions(
      where: {
        _or: [
          { from_address: { _eq: $user_address } },
          { to_address: { _eq: $user_address } }
        ]
      },
      order_by: { created_at: desc }
    ) @skip(if: $skip_transactions) {
      id
      transaction_hash
      from_address
      to_address
      amount
      token_type
      chatbot_id
      created_at
    }
  }
`;

// Get earnings summary by date - Safe version that skips if table doesn't exist
export const GET_EARNINGS_TIMELINE = gql`
  query GetEarningsTimeline($skip_payments: Boolean = true, $days_ago: timestamptz!) {
    conversation_payments(
      where: {
        payment_status: { _eq: "completed" },
        created_at: { _gte: $days_ago }
      },
      order_by: { created_at: desc }
    ) @skip(if: $skip_payments) {
      amount
      created_at
      chatbot_id
    }
  }
`;

// Optional query - only use if user_wallets table exists
export const GET_USER_WALLET_DATA = gql`
  query GetUserWalletData($user_address: String, $skip_wallets: Boolean = true) {
    user_wallets(where: { user_address: { _eq: $user_address } }) @skip(if: $skip_wallets) {
      id
      user_address
      token_balance
      updated_at
    }
  }
`;

// Safe version without user_wallets dependency
export const GET_USER_WALLET_DATA_SAFE = gql`
  query GetUserWalletDataSafe($user_address: String!) {
    # This query will work without user_wallets table
    chatbots(limit: 1) {
      id
    }
  }
`;

// Get platform earnings from token purchases - Safe version with skip
export const GET_PLATFORM_EARNINGS = gql`
  query GetPlatformEarnings($days_ago: timestamptz, $skip_platform_earnings: Boolean = false) {
    platform_earnings(
      where: { created_at: { _gte: $days_ago } },
      order_by: { created_at: desc }
    ) @skip(if: $skip_platform_earnings) {
      id
      source_type
      amount
      currency
      transaction_hash
      user_address
      created_at
    }
  }
`;

// Get user token purchases - Safe version with skip
export const GET_USER_TOKEN_PURCHASES = gql`
  query GetUserTokenPurchases($user_address: String!, $days_ago: timestamptz, $skip_token_purchases: Boolean = false) {
    token_purchases(
      where: { 
        user_address: { _eq: $user_address },
        created_at: { _gte: $days_ago }
      },
      order_by: { created_at: desc }
    ) @skip(if: $skip_token_purchases) {
      id
      eth_amount
      chat_amount
      transaction_hash
      purchase_type
      created_at
    }
  }
`;

// Get all token purchases for platform analytics - Safe version with skip
export const GET_ALL_TOKEN_PURCHASES = gql`
  query GetAllTokenPurchases($days_ago: timestamptz, $skip_token_purchases: Boolean = false) {
    token_purchases(
      where: { created_at: { _gte: $days_ago } },
      order_by: { created_at: desc }
    ) @skip(if: $skip_token_purchases) {
      id
      user_address
      eth_amount
      chat_amount
      transaction_hash
      purchase_type
      created_at
    }
  }
`;
