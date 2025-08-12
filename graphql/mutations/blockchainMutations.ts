import { gql } from "@apollo/client";

// Blockchain-related mutations
export const MINT_CHATBOT_NFT = gql`
  mutation MintChatbotNFT(
    $chatbot_id: Int!, 
    $token_id: String!, 
    $contract_address: String!,
    $ipfs_hash: String
  ) {
    insert_chatbot_nfts(objects: {
      chatbot_id: $chatbot_id,
      token_id: $token_id,
      contract_address: $contract_address,
      ipfs_hash: $ipfs_hash,
      minted_at: "now()"
    }) {
      returning {
        id
        token_id
        chatbot_id
        ipfs_hash
      }
    }
  }
`;

export const RECORD_BLOCKCHAIN_TRANSACTION = gql`
  mutation RecordBlockchainTransaction(
    $transaction_hash: String!,
    $from_address: String!,
    $to_address: String!,
    $amount: numeric!,
    $token_type: String!,
    $chatbot_id: Int
  ) {
    insert_blockchain_transactions(objects: {
      transaction_hash: $transaction_hash,
      from_address: $from_address,
      to_address: $to_address,
      amount: $amount,
      token_type: $token_type,
      chatbot_id: $chatbot_id,
      created_at: "now()"
    }) {
      returning {
        id
        transaction_hash
      }
    }
  }
`;

export const UPDATE_USER_TOKEN_BALANCE = gql`
  mutation UpdateUserTokenBalance($user_address: String!, $balance: numeric!) {
    insert_user_wallets(
      objects: {
        user_address: $user_address,
        token_balance: $balance,
        updated_at: "now()"
      },
      on_conflict: {
        constraint: user_wallets_user_address_key,
        update_columns: [token_balance, updated_at]
      }
    ) {
      returning {
        id
        user_address
        token_balance
      }
    }
  }
`;

// Record ETH to CHAT token purchases
export const RECORD_TOKEN_PURCHASE = gql`
  mutation RecordTokenPurchase(
    $user_address: String!,
    $eth_amount: numeric!,
    $chat_amount: numeric!,
    $transaction_hash: String!,
    $purchase_type: String!
  ) {
    insert_token_purchases(objects: {
      user_address: $user_address,
      eth_amount: $eth_amount,
      chat_amount: $chat_amount,
      transaction_hash: $transaction_hash,
      purchase_type: $purchase_type,
      created_at: "now()"
    }) {
      returning {
        id
        user_address
        eth_amount
        chat_amount
        transaction_hash
        created_at
      }
    }
  }
`;

// Record platform earnings from token purchases
export const RECORD_PLATFORM_EARNINGS = gql`
  mutation RecordPlatformEarnings(
    $source_type: String!,
    $amount: numeric!,
    $currency: String!,
    $transaction_hash: String,
    $user_address: String
  ) {
    insert_platform_earnings(objects: {
      source_type: $source_type,
      amount: $amount,
      currency: $currency,
      transaction_hash: $transaction_hash,
      user_address: $user_address,
      created_at: "now()"
    }) {
      returning {
        id
        source_type
        amount
        currency
        created_at
      }
    }
  }
`;
