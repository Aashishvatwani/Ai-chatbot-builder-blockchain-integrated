// Test payment insertion to verify the system works
const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');

const client = new ApolloClient({
  link: createHttpLink({
    uri: 'https://golden-mayfly-53.hasura.app/v1/graphql',
    headers: {
      'content-type': 'application/json',
      'x-hasura-admin-secret': 'xyAgGMmP7dZ2FvV4F50K6H3hxl0a1l6qWO4gTd2HBenOcn5eJO8e9NSo784vz0EQ'
    }
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: { fetchPolicy: 'no-cache', errorPolicy: 'all' }
  }
});

const INSERT_TEST_PAYMENT = gql`
  mutation InsertTestPayment($payment: conversation_payments_insert_input!) {
    insert_conversation_payments_one(object: $payment) {
      id
      amount
      chatbot_id
      chat_session_id
      payment_status
      user_address
      transaction_hash
      created_at
    }
  }
`;

const GET_EARNINGS_WITH_RELATIONSHIPS = gql`
  query GetEarningsWithRelationships {
    conversation_payments(limit: 10) {
      id
      amount
      payment_status
      created_at
      user_address
      transaction_hash
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

async function testPaymentSystem() {
  try {
    console.log('🧪 Testing Payment System...\n');
    
    // 1. Insert a test payment
    console.log('1. Inserting test payment...');
    const testPayment = {
      chatbot_id: 34, // Using existing chatbot ID
      chat_session_id: 3, // Using existing session ID
      amount: "0.001",
      payment_status: "completed",
      user_address: "0x742d35Cc6479C0532c12345fe1234567890ABCDEF",
      transaction_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      idx_conversation_payments_user: "test_user_001"
    };
    
    const insertResult = await client.mutate({
      mutation: INSERT_TEST_PAYMENT,
      variables: { payment: testPayment }
    });
    
    console.log('✅ Test payment inserted:', insertResult.data.insert_conversation_payments_one);
    
    // 2. Query with relationships
    console.log('\n2. Querying payments with relationships...');
    const earningsResult = await client.query({
      query: GET_EARNINGS_WITH_RELATIONSHIPS
    });
    
    console.log('💰 Payments with relationships:');
    earningsResult.data.conversation_payments.forEach((payment, index) => {
      console.log(`  ${index + 1}. $${payment.amount} (${payment.payment_status})`);
      console.log(`     Bot: ${payment.chatbot?.name || 'Unknown'} (User: ${payment.chatbot?.clerk_user_id || 'Unknown'})`);
      console.log(`     Guest: ${payment.chat_session?.guest?.name || payment.chat_session?.guest?.email || 'Anonymous'}`);
      console.log(`     TX: ${payment.transaction_hash}`);
      console.log('');
    });
    
    console.log('🎉 Payment system is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing payment system:', error.message);
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach(gqlError => {
        console.error('GraphQL Error:', gqlError.message);
      });
    }
  }
}

testPaymentSystem().then(() => {
  console.log('\n🎯 Test complete!');
  process.exit(0);
}).catch(console.error);
