const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');

// Create Apollo Client for Hasura Cloud
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
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    }
  }
});

// Test queries
const CHECK_TABLES = gql`
  query CheckTables {
    chatbots(limit: 5) {
      id
      name
      clerk_user_id
      created_at
    }
    conversation_payments(limit: 5) {
      id
      amount
      chatbot_id
      chat_session_id
      payment_status
      created_at
      user_address
      transaction_hash
    }
    chat_sessions(limit: 5) {
      id
      chatbot_id
      guest_id
      created_at
    }
  }
`;

const CHECK_RELATIONSHIPS = gql`
  query CheckRelationships {
    conversation_payments(limit: 3) {
      id
      amount
      payment_status
      created_at
      chatbot {
        id
        name
        clerk_user_id
      }
      chat_session {
        id
        created_at
        guest {
          name
          email
        }
      }
    }
  }
`;

const GET_ALL_EARNINGS_BY_USER = gql`
  query GetAllEarningsByUser {
    chatbots {
      id
      name
      clerk_user_id
      created_at
      conversation_payments(where: { payment_status: { _eq: "completed" } }) {
        id
        amount
        payment_status
        created_at
        user_address
        transaction_hash
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

async function debugEarnings() {
  try {
    console.log('🔍 Debugging Earnings Data...\n');
    
    // 1. Check if tables have data
    console.log('1. Checking table data...');
    const tablesResult = await client.query({ query: CHECK_TABLES });
    
    console.log('📊 Chatbots:', tablesResult.data.chatbots.length);
    tablesResult.data.chatbots.forEach(bot => {
      console.log(`  - ${bot.name} (ID: ${bot.id}, User: ${bot.clerk_user_id})`);
    });
    
    console.log('💰 Conversation Payments:', tablesResult.data.conversation_payments.length);
    tablesResult.data.conversation_payments.forEach(payment => {
      console.log(`  - ${payment.amount} (Bot: ${payment.chatbot_id}, Session: ${payment.chat_session_id}, Status: ${payment.payment_status})`);
    });
    
    console.log('💬 Chat Sessions:', tablesResult.data.chat_sessions.length);
    tablesResult.data.chat_sessions.forEach(session => {
      console.log(`  - Session ${session.id} (Bot: ${session.chatbot_id}, Guest: ${session.guest_id})`);
    });
    
    // 2. Test relationships
    console.log('\n2. Testing relationships...');
    try {
      const relationshipsResult = await client.query({ query: CHECK_RELATIONSHIPS });
      console.log('✅ Relationships working! Sample data:');
      relationshipsResult.data.conversation_payments.forEach(payment => {
        console.log(`  - $${payment.amount} (${payment.payment_status}) from Bot: ${payment.chatbot?.name || 'Unknown'} (User: ${payment.chatbot?.clerk_user_id || 'Unknown'})`);
        if (payment.chat_session?.guest) {
          console.log(`    Guest: ${payment.chat_session.guest.name || payment.chat_session.guest.email || 'Anonymous'}`);
        }
      });
    } catch (error) {
      console.log('❌ Relationships not working:', error.message);
    }
    
    // 3. Check all user earnings without variables
    console.log('\n3. Testing all user earnings...');
    try {
      const allEarningsResult = await client.query({ query: GET_ALL_EARNINGS_BY_USER });
      
      console.log('👤 All user earnings data:');
      if (allEarningsResult.data && allEarningsResult.data.chatbots) {
        allEarningsResult.data.chatbots.forEach(bot => {
          const totalEarnings = bot.conversation_payments_aggregate.aggregate.sum.amount || '0';
          const paymentCount = bot.conversation_payments_aggregate.aggregate.count;
          console.log(`  - User: ${bot.clerk_user_id}`);
          console.log(`    Bot: ${bot.name} (ID: ${bot.id})`);
          console.log(`    Earnings: $${totalEarnings} from ${paymentCount} payments`);
          
          if (bot.conversation_payments.length > 0) {
            console.log(`    Recent payments:`);
            bot.conversation_payments.slice(0, 3).forEach(payment => {
              console.log(`      • $${payment.amount} (${payment.payment_status}) - ${payment.created_at}`);
            });
          }
          console.log('');
        });
        
        // Summary
        const totalBots = allEarningsResult.data.chatbots.length;
        const botsWithEarnings = allEarningsResult.data.chatbots.filter(bot => bot.conversation_payments.length > 0).length;
        const totalPayments = allEarningsResult.data.chatbots.reduce((sum, bot) => sum + bot.conversation_payments.length, 0);
        
        console.log(`📈 Summary:`);
        console.log(`  Total chatbots: ${totalBots}`);
        console.log(`  Chatbots with earnings: ${botsWithEarnings}`);
        console.log(`  Total payments: ${totalPayments}`);
      } else {
        console.log('No earnings data found');
      }
      
    } catch (error) {
      console.log('❌ All earnings query failed:', error.message);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run the debug
debugEarnings().then(() => {
  console.log('\n🎯 Debug complete!');
  process.exit(0);
}).catch(console.error);
