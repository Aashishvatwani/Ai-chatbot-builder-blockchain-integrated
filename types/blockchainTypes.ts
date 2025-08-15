// Extended types for blockchain integration
export interface ChatbotNFT {
  id: number;
  chatbot_id: number;
  token_id: string;
  contract_address: string;
  minted_at: string;
  chatbot?: Chatbot;
}

export interface UserWallet {
  id: number;
  user_address: string;
  token_balance: string;
  updated_at: string;
}

export interface BlockchainTransaction {
  id: number;
  transaction_hash: string;
  from_address: string;
  to_address: string;
  amount: string;
  token_type: 'CHAT' | 'ETH';
  chatbot_id?: number;
  created_at: string;
  chatbot?: Chatbot;
}

// Existing interfaces
export interface Chatbot {
    id: number;
    name: string;
    created_at: string;
    clerk_user_id: string;
    chatbot_characteristics: ChatbotCharacteristic[];
    chat_sessions: ChatSession[];
    // Blockchain additions
    nft_data?: ChatbotNFT;
    total_earnings?: string;
}

export interface ChatbotCharacteristic {
    id: number;
    content: string;
    created_at: string;
    chatbot_id: number;
}


export interface Message {
    id: number;
    chat_session_id: number;
    content: string;
    created_at: string;
    sender: "ai"|"user";
    // Blockchain additions
    transaction_hash?: string;
    token_cost?: string;
}

export interface Guest{
    id: number;
    name: string;
    email: string;
    created_at: string;
    // Blockchain additions
    wallet_address?: string;
    token_balance?: string;
}

export interface ChatSession {
    id: number;
    created_at: string;
    guest_id: string;
    messages: Message[];
    chatbot_id: number;
    guest: Guest;
    // Blockchain additions
    total_cost?: string;
    payment_status?: 'pending' | 'completed' | 'failed';
}

// Response interfaces
export interface GetChatbotResponse{
    chatbots: Chatbot[];
}

export interface GetChatbotByIdVariables{
    id:number
}

export interface CharacteristicProps {
  characteristic: {
    content: string;
  };
}

export interface GetChatbotsByUserData {
    chatbots: Chatbot[];
}

export interface GetChatbotsByUserVariables {
    userId: string;
}

export interface GetUserChatbotsResponse {
    chatbots: Chatbot[];
}

export interface GetUserChatbotsVariables {
    userId: string;
}

export interface GetChatSessionMessagesResponses {
    chat_sessions: {
        id: number;
        created_at: string;
        messages: Message[];
        chatbot: { name: string };
        guest: { name: string; email: string };
    }[];
}

export interface GetChatSessionMessagesVariables {
    id: number;
}

export interface MessagesByChatSessionIdResponse {
    chat_sessions:ChatSession[];
}

export interface MessagesByChatSessionIdVariables {
    id: number;
}

// Blockchain-specific response interfaces
export interface GetChatbotNFTDataResponse {
    chatbot_nfts: ChatbotNFT[];
}

export interface GetChatbotNFTDataVariables {
    chatbot_id: number;
}

export interface GetUserWalletDataResponse {
    user_wallets: UserWallet[];
}

export interface GetUserWalletDataVariables {
    user_address: string;
}

export interface GetBlockchainTransactionsResponse {
    blockchain_transactions: BlockchainTransaction[];
}

export interface GetBlockchainTransactionsVariables {
    user_address: string;
}

export interface GetChatbotEarningsResponse {
    blockchain_transactions: BlockchainTransaction[];
}

export interface GetChatbotEarningsVariables {
    chatbot_id: number;
}
