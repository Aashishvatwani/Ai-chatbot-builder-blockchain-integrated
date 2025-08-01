import { gql } from "@apollo/client";

export const CREATE_CHATBOT = gql`
  mutation CreateChatBot($clerk_user_id: String!, $name: String!) {
    insert_chatbots(objects: {clerk_user_id: $clerk_user_id, name: $name}) {
      returning {
        id
        name
      }
    }
  }
`;
export const REMOVE_CHARACTERISTIC=gql`
mutation RemoveCharacteristic($id: Int!) {
  delete_chatbot_characteristics(where: {id: {_eq: $id}}) {
    affected_rows
    returning {
      id
    }
  }
}
`
export const DELETE_CHATBOT=gql`
mutation DeleteChatbot($id: Int!) {
  delete_chatbots(where: {id: {_eq: $id}}) {
    affected_rows
    returning {
      id
    }
  }
}
`
export const ADD_CHARACTERISTIC=gql`
mutation AddCharacteristic($chatbotId: Int!, $content: String!) {
  insert_chatbot_characteristics(objects: {chatbot_id: $chatbotId, content: $content}) {
    affected_rows
    returning {
      id
      content
    }
  }
}
`
export const UPDATE_CHATPOD=gql`
mutation UpdateChatbot($id: Int!, $name: String!) {
  update_chatbots(where: {id: {_eq: $id}}, _set: {name: $name}) {
    affected_rows
    returning {
      id
      name
    }
  }
}
`
export const INSERT_MESSAGE=gql`
mutation InsertMessage($chat_session_id: Int!, $content: String!, $sender: String!) {
  insert_messages(objects: {chat_session_id: $chat_session_id, content: $content, sender: $sender}) {
    affected_rows
    returning {
      id
      content
      created_at
      sender
    }
  }
}
`