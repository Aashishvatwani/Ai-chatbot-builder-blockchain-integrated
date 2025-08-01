import client from "../../graphql/apollo-client"
import { INSERT_MESSAGE } from "../../graphql/mutations/mutations";
import { gql } from "@apollo/client";
async function startNewChat(
    guestName:string,
    guestEmail:string,
    chatbotId:number
){
    try{
const guestResult = await client.mutate({
    mutation: gql`
    mutation insertGuest($name: String!, $email: String!) {
        insert_guests(objects: {name: $name, email: $email}) {
            returning {
                id
            }
        }
    }
    `,
    variables: {
        name: guestName,
        email: guestEmail
    }
});
const guestId = guestResult.data.insert_guests.returning[0].id;
console.log("New guest ID:", guestId);
// ...existing code...
const chatSessionResult = await client.mutate({
    mutation: gql`
    mutation insertChatSession($guest_id: Int!, $chatbot_id: Int!) {
        insert_chat_sessions(objects: {guest_id: $guest_id, chatbot_id: $chatbot_id}) {
            returning {
                id
            }
        }
    }
    `,
    variables: {
        guest_id: guestId,     // Match the mutation parameter
        chatbot_id: chatbotId  // Match the mutation parameter
    }
});
// ...existing code...
console.log("New chat session ID:", chatSessionResult.data.insert_chat_sessions.returning[0].id);
await client.mutate({
    mutation: INSERT_MESSAGE,
    variables: {
        chat_session_id: chatSessionResult.data.insert_chat_sessions.returning[0].id,
        content: `Welcome ${guestName} to the chat!`,
        sender: "ai"

    }   
});
console.log("New chat session started successfully");
return chatSessionResult.data.insert_chat_sessions.returning[0].id;
    }catch(error){
        console.log("Error stating new chat session :",error);
    }
}
export default startNewChat;