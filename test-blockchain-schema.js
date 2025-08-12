// Test script to verify blockchain tables are properly tracked in Hasura
// Run this with: node test-blockchain-schema.js

const { ApolloClient, InMemoryCache, HttpLink, gql } = require('@apollo/client');

// Create Apollo Client
const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NODE_ENV === "development" 
      ? "http://localhost:3000/api/graphql"
      : "/api/graphql",
  }),
  cache: new InMemoryCache(),
});

// Test queries
const testQueries = [
  {
    name: "Test conversation_payments table exists",
    query: gql`
      query TestConversationPayments {
        conversation_payments(limit: 1) {
          id
        }
      }
    `
  },
  {
    name: "Test conversation_payments fields",
    query: gql`
      query TestConversationPaymentsFields {
        conversation_payments(limit: 1) {
          id
          chatbot_id
          amount
          payment_status
          user_address
          created_at
        }
      }
    `
  },
  {
    name: "Test conversation_payments filter by chatbot_id",
    query: gql`
      query TestConversationPaymentsFilter {
        conversation_payments(
          where: { chatbot_id: { _eq: 1 } }
          limit: 1
        ) {
          id
          chatbot_id
        }
      }
    `
  },
  {
    name: "Test other blockchain tables",
    query: gql`
      query TestOtherBlockchainTables {
        chatbot_nfts(limit: 1) { id }
        blockchain_transactions(limit: 1) { id }
        user_wallets(limit: 1) { id }
      }
    `
  }
];

async function runTests() {
  console.log("🧪 Testing Blockchain Schema Setup...\n");
  
  for (const test of testQueries) {
    try {
      console.log(`Testing: ${test.name}`);
      const result = await client.query({ 
        query: test.query,
        errorPolicy: 'all'
      });
      
      if (result.errors) {
        console.log("❌ GraphQL Errors:");
        result.errors.forEach(error => {
          console.log(`   - ${error.message}`);
        });
      } else {
        console.log("✅ Success!");
      }
      
      console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    } catch (error) {
      console.log("❌ Error:", error.message);
    }
    console.log("");
  }
}

// Run the tests
runTests().catch(console.error);
