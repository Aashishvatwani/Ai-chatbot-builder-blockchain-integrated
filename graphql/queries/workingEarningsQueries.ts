import { gql } from '@apollo/client';

// Working GraphQL queries for earnings after fixing relationships

export const GET_USER_EARNINGS_WORKING = gql`
  query GetUserEarningsWorking($userId: String!) {
    chatbots(where: { clerk_user_id: { _eq: $userId } }) {
      id
      name
      created_at
      clerk_user_id
      conversation_payments(where: { payment_status: { _eq: "completed" } }) {
        id
        amount
        payment_status
        created_at
        user_address
        transaction_hash
        chat_session {
          id
          guest {
            name
            email
          }
        }
      }
    }
  }
`;

export const GET_EARNINGS_SUMMARY = gql`
  query GetEarningsSummary($userId: String!) {
    chatbots(where: { clerk_user_id: { _eq: $userId } }) {
      id
      name
      conversation_payments_aggregate(where: { payment_status: { _eq: "completed" } }) {
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

export const GET_RECENT_PAYMENTS = gql`
  query GetRecentPayments($userId: String!, $limit: Int = 20) {
    conversation_payments(
      where: { 
        payment_status: { _eq: "completed" }
        chatbot: { clerk_user_id: { _eq: $userId } }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      amount
      created_at
      user_address
      transaction_hash
      chatbot {
        id
        name
      }
      chat_session {
        id
        guest {
          name
          email
        }
      }
    }
  }
`;

export const GET_EARNINGS_BY_CHATBOT = gql`
  query GetEarningsByChatbot($chatbotId: Int!) {
    chatbots_by_pk(id: $chatbotId) {
      id
      name
      conversation_payments(where: { payment_status: { _eq: "completed" } }) {
        id
        amount
        created_at
        user_address
        transaction_hash
        chat_session {
          guest {
            name
            email
          }
        }
      }
      conversation_payments_aggregate(where: { payment_status: { _eq: "completed" } }) {
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

// Test if relationships are working
export const TEST_EARNINGS_RELATIONSHIPS = gql`
  query TestEarningsRelationships {
    conversation_payments(limit: 5) {
      id
      amount
      payment_status
      chatbot {
        id
        name
        clerk_user_id
      }
      chat_session {
        id
        guest {
          name
          email
        }
      }
    }
  }
`;

export default {
  GET_USER_EARNINGS_WORKING,
  GET_EARNINGS_SUMMARY,
  GET_RECENT_PAYMENTS,
  GET_EARNINGS_BY_CHATBOT,
  TEST_EARNINGS_RELATIONSHIPS
};
