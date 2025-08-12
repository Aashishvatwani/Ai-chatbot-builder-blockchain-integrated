import { gql } from "@apollo/client";

// Fixed GraphQL queries for earnings data after establishing relationships

// Get comprehensive earnings data for a user's chatbots
export const GET_USER_EARNINGS_COMPLETE = gql`
  query GetUserEarningsComplete($user_id: String!) {
    chatbots(where: { clerk_user_id: { _eq: $user_id } }) {
      id
      name
      created_at
      
      # Conversation payments with relationships
      conversation_payments(
        where: { payment_status: { _eq: "completed" } }
        order_by: { created_at: desc }
      ) {
        id
        amount
        created_at
        user_address
        transaction_hash
        payment_status
        chat_session {
          id
          created_at
          guest {
            id
            name
            email
          }
        }
      }
      
      # Aggregate earnings data
      conversation_payments_aggregate(
        where: { payment_status: { _eq: "completed" } }
      ) {
        aggregate {
          count
          sum {
            amount
          }
        }
      }
      
      # Blockchain transactions
      blockchain_transactions(
        order_by: { created_at: desc }
        limit: 10
      ) {
        id
        transaction_hash
        amount
        token_type
        from_address
        to_address
        created_at
      }
      
      # NFT data
      chatbot_nfts {
        id
        token_id
        contract_address
        metadata_uri
        minted_at
      }
    }
  }
`;

// Get earnings summary by date range
export const GET_EARNINGS_BY_DATE_RANGE = gql`
  query GetEarningsByDateRange($user_id: String!, $start_date: timestamp!, $end_date: timestamp!) {
    chatbots(where: { clerk_user_id: { _eq: $user_id } }) {
      id
      name
      
      conversation_payments(
        where: { 
          payment_status: { _eq: "completed" }
          created_at: { _gte: $start_date, _lte: $end_date }
        }
        order_by: { created_at: desc }
      ) {
        id
        amount
        created_at
        user_address
        chat_session {
          id
          messages_aggregate {
            aggregate {
              count
            }
          }
        }
      }
      
      conversation_payments_aggregate(
        where: { 
          payment_status: { _eq: "completed" }
          created_at: { _gte: $start_date, _lte: $end_date }
        }
      ) {
        aggregate {
          count
          sum {
            amount
          }
        }
      }
    }
  }
`;

// Get recent earnings activity
export const GET_RECENT_EARNINGS = gql`
  query GetRecentEarnings($user_id: String!, $limit: Int = 20) {
    chatbots(where: { clerk_user_id: { _eq: $user_id } }) {
      id
      name
      
      conversation_payments(
        where: { payment_status: { _eq: "completed" } }
        order_by: { created_at: desc }
        limit: $limit
      ) {
        id
        amount
        created_at
        user_address
        transaction_hash
        chat_session {
          id
          created_at
          guest {
            name
            email
          }
          messages_aggregate(
            where: { sender: { _in: ["user", "guest"] } }
          ) {
            aggregate {
              count
            }
          }
        }
      }
    }
  }
`;

// Get earnings by chatbot
export const GET_CHATBOT_DETAILED_EARNINGS = gql`
  query GetChatbotDetailedEarnings($chatbot_id: Int!) {
    chatbots_by_pk(id: $chatbot_id) {
      id
      name
      created_at
      
      conversation_payments(
        where: { payment_status: { _eq: "completed" } }
        order_by: { created_at: desc }
      ) {
        id
        amount
        created_at
        user_address
        transaction_hash
        chat_session {
          id
          created_at
          guest {
            id
            name
            email
          }
          messages(
            where: { sender: { _in: ["user", "guest"] } }
            order_by: { created_at: asc }
            limit: 5
          ) {
            id
            content
            sender
            created_at
          }
        }
      }
      
      # Total earnings stats
      conversation_payments_aggregate(
        where: { payment_status: { _eq: "completed" } }
      ) {
        aggregate {
          count
          sum {
            amount
          }
          avg {
            amount
          }
        }
      }
      
      # Chat sessions with payments
      chat_sessions(
        where: { 
          conversation_payments: { payment_status: { _eq: "completed" } }
        }
        order_by: { created_at: desc }
      ) {
        id
        created_at
        guest {
          name
          email
        }
        conversation_payments(
          where: { payment_status: { _eq: "completed" } }
        ) {
          id
          amount
          transaction_hash
        }
      }
    }
  }
`;

// Get top paying users
export const GET_TOP_PAYING_USERS = gql`
  query GetTopPayingUsers($user_id: String!, $limit: Int = 10) {
    conversation_payments(
      where: { 
        payment_status: { _eq: "completed" }
        chatbot: { clerk_user_id: { _eq: $user_id } }
      }
      order_by: { amount: desc }
      limit: $limit
    ) {
      id
      amount
      user_address
      created_at
      chatbot {
        id
        name
      }
      chat_session {
        guest {
          name
          email
        }
      }
    }
  }
`;

// Get earnings analytics
export const GET_EARNINGS_ANALYTICS = gql`
  query GetEarningsAnalytics($user_id: String!) {
    chatbots(where: { clerk_user_id: { _eq: $user_id } }) {
      id
      name
      created_at
      
      # Total earnings
      conversation_payments_aggregate(
        where: { payment_status: { _eq: "completed" } }
      ) {
        aggregate {
          count
          sum {
            amount
          }
          avg {
            amount
          }
        }
      }
      
      # Earnings this month
      conversation_payments_aggregate(
        where: { 
          payment_status: { _eq: "completed" }
          created_at: { _gte: "date_trunc('month', now())" }
        }
      ) {
        aggregate {
          count
          sum {
            amount
          }
        }
      }
      
      # Earnings this week
      conversation_payments_aggregate(
        where: { 
          payment_status: { _eq: "completed" }
          created_at: { _gte: "date_trunc('week', now())" }
        }
      ) {
        aggregate {
          count
          sum {
            amount
          }
        }
      }
      
      # Chat sessions with payments vs without
      chat_sessions_aggregate {
        aggregate {
          count
        }
      }
      
      chat_sessions_aggregate(
        where: { 
          conversation_payments: { payment_status: { _eq: "completed" } }
        }
      ) {
        aggregate {
          count
        }
      }
    }
  }
`;

// Test query to verify relationships are working
export const TEST_RELATIONSHIPS = gql`
  query TestRelationships {
    conversation_payments(limit: 5) {
      id
      amount
      chatbot {
        id
        name
      }
      chat_session {
        id
        guest {
          name
        }
      }
    }
  }
`;

export default {
  GET_USER_EARNINGS_COMPLETE,
  GET_EARNINGS_BY_DATE_RANGE,
  GET_RECENT_EARNINGS,
  GET_CHATBOT_DETAILED_EARNINGS,
  GET_TOP_PAYING_USERS,
  GET_EARNINGS_ANALYTICS,
  TEST_RELATIONSHIPS
};
