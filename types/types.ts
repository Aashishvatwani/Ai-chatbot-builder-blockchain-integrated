export interface Chatbot {
    id: number;
    name: string;
    created_at: string;
    clerk_user_id: string;
    chatbot_characteristics: ChatbotCharacteristic[];
    chat_sessions: ChatSession[];
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
    sender: "ai"|"user"; // 'user' or 'bot'
}
export interface Guest{
    id: number;
    name: string;
    email: string;
    created_at: string;
}
export interface ChatSession {
    id: number;
    created_at: string;
    guest_id: string;
    messages: Message[];
    chatbot_id: number;
    guest: Guest;
}
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