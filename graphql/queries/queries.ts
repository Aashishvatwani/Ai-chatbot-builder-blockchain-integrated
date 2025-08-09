import { gql } from "@apollo/client";



export const CREATE_CHATBOT=gql`
mutation CreateChatBot($clerk_user_id:String!,$name:String!){
insert_chatbots(clerk_user_id:$clerk_user_id,name:$name)
{
    id 
    name 
}
}`
export const GET_CHATPODS_BY_ID=gql`
query GetChatbotById($id:Int!){
    chatbots(where: { id: { _eq: $id } }){
        id
        name
        created_at
        ipfs_hash
        chatbot_characteristics{
            id 
            content 
            created_at 
        }
        chat_sessions{
            id 
            created_at 
            guest_id
            messages{
                id 
                content 
                created_at 
                sender
            }
        }
}
}`
export const GET_USER_CHATPODS=gql`
query GetUserChatbots($userId:String!){
    chatbots(where: { clerk_user_id: { _eq: $userId } }){
        id
        name
        created_at

        chat_sessions{
            id 
            created_at 
            guest_id
            guest{
                id 
                name 
                email 
                created_at
            }
        }
}
}`
export const GET_CHATPODS_BY_USER=gql`
query GetChatbotsByUser($userId:String!){
    chatbots(where: { clerk_user_id: { _eq: $userId } }){
        id
        name
        created_at
        chatbot_characteristics{
            id 
            content 
            created_at 
        }
        chat_sessions{
            id 
            created_at 
            guest_id
            messages{
                id 
                content 
                created_at 
                sender
            }
        }
}
}`
export const GET_CHAT_SESSION_MESSAGES=gql`
query GetChatSessionMessages($id:Int!){
    chat_sessions(where: { id: { _eq: $id } }){
        id
        created_at
        messages(order_by: {created_at: asc}) {
            id 
            content 
            created_at 
            sender
        }
        chatbot{
            id
            name
        }
        guest{
            id
            name
            email
        }
    }
}`
export const GET_MESSAGES_BY_SESSION_ID=gql`
query GetMessagesBySessionId($id:Int!){
    chat_sessions(where: { id: { _eq: $id } }){
        messages{
            id 
            content 
            created_at 
            sender
        }
    }
}`