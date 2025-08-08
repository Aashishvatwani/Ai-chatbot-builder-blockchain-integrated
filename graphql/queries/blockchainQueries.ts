import { gql } from "@apollo/client";

export const GET_CHATBOT_NFT_DATA = gql`
  query GetChatbotNFTData($chatbot_id: Int!) {
    chatbot_nfts(where: { chatbot_id: { _eq: $chatbot_id } }) {
      id
      token_id
      contract_address
      minted_at
      chatbot {
        id
        name
        chatbot_characteristics {
          content
        }
      }
    }
  }
`;

export const GET_USER_WALLET_DATA = gql`
  query GetUserWalletData($user_address: String!) {
    user_wallets(where: { user_address: { _eq: $user_address } }) {
      id
      user_address
      token_balance
      updated_at
    }
  }
`;

export const GET_BLOCKCHAIN_TRANSACTIONS = gql`
  query GetBlockchainTransactions($user_address: String!) {
    blockchain_transactions(
      where: {
        _or: [
          { from_address: { _eq: $user_address } },
          { to_address: { _eq: $user_address } }
        ]
      },
      order_by: { created_at: desc }
    ) {
      id
      transaction_hash
      from_address
      to_address
      amount
      token_type
      chatbot_id
      created_at
      chatbot {
        id
        name
      }
    }
  }
`;

export const GET_CHATBOT_EARNINGS = gql`
  query GetChatbotEarnings($chatbot_id: Int!) {
    blockchain_transactions(
      where: { 
        chatbot_id: { _eq: $chatbot_id },
        token_type: { _eq: "CHAT" }
      }
    ) {
      amount
      created_at
    }
  }
`;
