import { gql } from "@apollo/client";

// Enhanced analytics queries for question analysis and product insights

export const GET_ENHANCED_ANALYTICS = gql`
  query GetEnhancedAnalytics($userId: String!, $startDate: timestamp, $endDate: timestamp) {
    chatbots(where: { clerk_user_id: { _eq: $userId } }) {
      id
      name
      created_at
      chat_sessions(
        where: { 
          created_at: { _gte: $startDate, _lte: $endDate }
        }
      ) {
        id
        created_at
        messages(
          where: { 
            sender: { _in: ["user", "guest"] }
            created_at: { _gte: $startDate, _lte: $endDate }
          }
          order_by: { created_at: desc }
        ) {
          id
          content
          created_at
          sender
        }
      }
    }
  }
`;

export const GET_QUESTION_CATEGORIES = gql`
  query GetQuestionCategories {
    question_categories(order_by: { name: asc }) {
      id
      name
      description
      keywords
    }
  }
`;

export const GET_ANALYZED_QUESTIONS = gql`
  query GetAnalyzedQuestions($userId: String!, $limit: Int = 50, $offset: Int = 0) {
    chatbots(where: { clerk_user_id: { _eq: $userId } }) {
      id
      name
      chat_sessions {
        id
        messages(
          where: { sender: { _in: ["user", "guest"] } }
          order_by: { created_at: desc }
          limit: $limit
          offset: $offset
        ) {
          id
          content
          created_at
          sender
          analyzed_question {
            id
            normalized_question
            sentiment_score
            complexity_score
            is_product_related
            extracted_products
            question_category {
              id
              name
              description
            }
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT_MENTIONS = gql`
  query GetProductMentions($userId: String!, $startDate: timestamp, $endDate: timestamp) {
    chatbots(where: { clerk_user_id: { _eq: $userId } }) {
      id
      name
      product_mentions(
        where: { 
          created_at: { _gte: $startDate, _lte: $endDate }
        }
        order_by: { created_at: desc }
      ) {
        id
        product_name
        mention_type
        context
        sentiment_score
        created_at
        message {
          id
          content
          sender
        }
      }
    }
  }
`;

export const GET_ANALYTICS_SUMMARY = gql`
  query GetAnalyticsSummary($userId: String!, $startDate: date, $endDate: date) {
    chatbots(where: { clerk_user_id: { _eq: $userId } }) {
      id
      name
      analytics_summaries(
        where: {
          period_start: { _gte: $startDate }
          period_end: { _lte: $endDate }
        }
        order_by: { period_start: desc }
      ) {
        id
        period_start
        period_end
        total_questions
        total_product_mentions
        avg_sentiment
        top_questions
        top_products
        category_breakdown
        created_at
      }
    }
  }
`;

export const GET_QUESTION_TRENDS = gql`
  query GetQuestionTrends($userId: String!, $days: Int = 30) {
    chatbots(where: { clerk_user_id: { _eq: $userId } }) {
      id
      name
      chat_sessions(
        where: {
          created_at: { _gte: "now() - interval '$days days'" }
        }
      ) {
        id
        created_at
        messages(
          where: { 
            sender: { _in: ["user", "guest"] }
            created_at: { _gte: "now() - interval '$days days'" }
          }
        ) {
          id
          content
          created_at
          analyzed_question {
            normalized_question
            sentiment_score
            is_product_related
            question_category {
              name
            }
          }
        }
      }
    }
  }
`;

export const GET_SENTIMENT_ANALYSIS = gql`
  query GetSentimentAnalysis($userId: String!, $startDate: timestamp, $endDate: timestamp) {
    chatbots(where: { clerk_user_id: { _eq: $userId } }) {
      id
      name
      chat_sessions(
        where: { 
          created_at: { _gte: $startDate, _lte: $endDate }
        }
      ) {
        messages(
          where: { 
            sender: { _in: ["user", "guest"] }
            created_at: { _gte: $startDate, _lte: $endDate }
          }
        ) {
          analyzed_question {
            sentiment_score
            complexity_score
            question_category {
              name
            }
          }
        }
      }
    }
  }
`;

export const GET_TOP_QUESTIONS_BY_CATEGORY = gql`
  query GetTopQuestionsByCategory($userId: String!, $categoryId: Int, $limit: Int = 20) {
    chatbots(where: { clerk_user_id: { _eq: $userId } }) {
      id
      name
      chat_sessions {
        messages(
          where: { 
            sender: { _in: ["user", "guest"] }
            analyzed_question: { category_id: { _eq: $categoryId } }
          }
          order_by: { created_at: desc }
          limit: $limit
        ) {
          id
          content
          created_at
          analyzed_question {
            normalized_question
            sentiment_score
            complexity_score
            is_product_related
            extracted_products
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT_INSIGHTS = gql`
  query GetProductInsights($userId: String!, $startDate: timestamp, $endDate: timestamp) {
    chatbots(where: { clerk_user_id: { _eq: $userId } }) {
      id
      name
      product_mentions_aggregate(
        where: { 
          created_at: { _gte: $startDate, _lte: $endDate }
        }
      ) {
        aggregate {
          count
          avg {
            sentiment_score
          }
        }
        nodes {
          product_name
          mention_type
          sentiment_score
          created_at
        }
      }
    }
  }
`;
