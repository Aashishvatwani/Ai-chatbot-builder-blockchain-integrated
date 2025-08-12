import { NextRequest, NextResponse } from 'next/server';
import { serveClient } from '@/lib/server/serverClient';
import { RECORD_BLOCKCHAIN_TRANSACTION } from '../../../../graphql/mutations/blockchainMutations';
import { gql } from '@apollo/client';

// Create conversation payment mutation - Fixed syntax
const RECORD_CONVERSATION_PAYMENT = gql`
  mutation RecordConversationPayment(
    $chat_session_id: Int!,
    $transaction_hash: String!,
    $amount: String!,
    $user_address: String!,
    $chatbot_id: Int!
  ) {
    insert_conversation_payments(objects: [{
      chat_session_id: $chat_session_id,
      transaction_hash: $transaction_hash,
      amount: $amount,
      payment_status: "completed",
      user_address: $user_address,
      chatbot_id: $chatbot_id
    }]) {
      returning {
        id
        amount
        created_at
        chatbot_id
        chat_session_id
        user_address
        transaction_hash
      }
    }
  }
`;

// Query to verify chat session exists and get chatbot info
const GET_CHAT_SESSION_INFO = gql`
  query GetChatSessionInfo($session_id: Int!) {
    chat_sessions_by_pk(id: $session_id) {
      id
      chatbot_id
      guest_id
      chatbot {
        id
        name
        clerk_user_id
      }
    }
  }
`;

export async function POST(request: NextRequest) {
  try {
    const { 
      chatbotId, 
      userAddress, 
      amount, 
      transactionHash, 
      chatSessionId 
    } = await request.json();

    // Validate required fields
    if (!chatbotId || !userAddress || !amount || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store payment in blockchain_transactions table
    const transactionResult = await serveClient.mutate({
      mutation: RECORD_BLOCKCHAIN_TRANSACTION,
      variables: {
        transaction_hash: transactionHash,
        from_address: userAddress,
        to_address: 'platform',
        amount: amount.toString(),
        token_type: 'CHAT',
        chatbot_id: parseInt(chatbotId)
      }
    });

    // Store conversation payment record
    let paymentResult = null;
    if (chatSessionId) {
      paymentResult = await serveClient.mutate({
        mutation: RECORD_CONVERSATION_PAYMENT,
        variables: {
          chat_session_id: parseInt(chatSessionId),
          transaction_hash: transactionHash,
          amount: amount.toString(),
          user_address: userAddress,
          chatbot_id: parseInt(chatbotId)
        }
      });
    }

    // Calculate creator earnings (80% of amount)
    const creatorEarnings = parseFloat(amount) * 0.8;

    console.log('💰 Payment recorded successfully in database:', {
      chatbotId,
      userAddress,
      totalAmount: `${amount} CHAT`,
      creatorEarnings: `${creatorEarnings} CHAT`,
      platformFee: `${parseFloat(amount) * 0.2} CHAT`,
      transactionHash,
      chatSessionId,
      transactionRecordId: transactionResult.data?.insert_blockchain_transactions?.returning?.[0]?.id,
      paymentRecordId: paymentResult?.data?.insert_conversation_payments?.returning?.[0]?.id,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment recorded successfully in database',
      creatorEarnings: creatorEarnings.toString(),
      transactionHash,
      recordedInDatabase: true
    });

  } catch (error) {
    console.error('Error recording payment to database:', error);
    return NextResponse.json(
      { error: 'Failed to record payment in database' },
      { status: 500 }
    );
  }
}
