import { NextRequest, NextResponse } from "next/server";
import { serveClient } from "@/lib/server/serverClient";
import {
  GET_CHATPODS_BY_ID,
  GET_MESSAGES_BY_SESSION_ID,
} from "../../../../graphql/queries/queries";
import { INSERT_MESSAGE } from "../../../../graphql/mutations/mutations";
import {
  GetChatbotResponse,
  MessagesByChatSessionIdResponse,
  MessagesByChatSessionIdVariables,
} from "../../../../types/types";

// --- Production-Ready Type Definitions ---

interface ChatMessage {
  sender: 'user' | 'assistant';
  content: string;
}

interface IPFSMetadata {
  name: string;
  description: string;
  characteristics: string[];
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  created_at: string;
  creator_address: string;
  chatbot_id: number;
}

type ChatHistory = ChatMessage[];

// --- IPFS Metadata Fetcher ---

async function fetchIPFSMetadata(ipfsHash: string): Promise<IPFSMetadata | null> {
  try {
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch IPFS metadata: ${response.status}`);
      return null;
    }
    
    const metadata = await response.json();
    return metadata as IPFSMetadata;
  } catch (error) {
    console.error('Error fetching IPFS metadata:', error);
    return null;
  }
}

// --- Enhanced AI Context Builder ---

function buildEnhancedSystemPrompt(
  chatbot: {
    chatbot_characteristics: Array<{ content: string }>;
  }, 
  ipfsMetadata?: IPFSMetadata | null
): string {
  let systemPrompt = "";
  
  // Add IPFS metadata context if available
  if (ipfsMetadata) {
    systemPrompt += `NFT Chatbot Profile:
- NFT Name: ${ipfsMetadata.name}
- Description: ${ipfsMetadata.description}
- Creator Address: ${ipfsMetadata.creator_address}
- Creation Date: ${ipfsMetadata.created_at}`;

    if (ipfsMetadata.characteristics?.length > 0) {
      systemPrompt += `
- Core NFT Characteristics: ${ipfsMetadata.characteristics.join(', ')}`;
    }

    if (ipfsMetadata.attributes && ipfsMetadata.attributes.length > 0) {
      systemPrompt += `
- NFT Attributes:`;
      ipfsMetadata.attributes.forEach(attr => {
        systemPrompt += `
  • ${attr.trait_type}: ${attr.value}`;
      });
    }

    systemPrompt += `

As an NFT chatbot, you embody the characteristics and attributes defined in your metadata. `;
  }

  // Add regular chatbot characteristics
  const chatbotCharacteristics = chatbot.chatbot_characteristics.map((c: { content: string }) => c.content);
  if (chatbotCharacteristics.length > 0) {
    systemPrompt += `Your key characteristics: ${chatbotCharacteristics.join(". ")}. `;
  }

  return systemPrompt;
}

// Ensure we're using the Edge runtime for streaming capabilities
export const runtime = 'edge';

// Helper function to format chat history for the Gemini API
const formatForGemini = (messages: ChatHistory, newContent: string) => {
  const formattedMessages = messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
  formattedMessages.push({
    role: 'user',
    parts: [{ text: newContent }],
  });
  return formattedMessages;
};

export async function POST(req: NextRequest) {
  try {
    const { name, chat_session_id, chatbot_id, content } = await req.json();

    // 1. --- Input Validation ---
    if (!name || !chat_session_id || !chatbot_id || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable not set");
      return NextResponse.json({ error: "Server configuration error: Missing API Key." }, { status: 500 });
    }

    // 2. --- Save the user's message to database first ---
    try {
      await serveClient.mutate({
        mutation: INSERT_MESSAGE,
        variables: {
          chat_session_id: chat_session_id,
          content: content,
          sender: "user"
        }
      });
      console.log("User message saved to database");
    } catch (error) {
      console.error("Error saving user message:", error);
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    // 3. --- Fetch necessary data in parallel for efficiency ---
    const [chatbotData, messageData] = await Promise.all([
      serveClient.query<GetChatbotResponse>({
        query: GET_CHATPODS_BY_ID,
        variables: { id: chatbot_id },
      }),




      
      serveClient.query<MessagesByChatSessionIdResponse, MessagesByChatSessionIdVariables>({
        query: GET_MESSAGES_BY_SESSION_ID,
        variables: { id: chat_session_id },
        fetchPolicy: "no-cache",
      })
    ]);

    const chatbot = chatbotData.data?.chatbots?.[0];
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Check if this chatbot has NFT metadata
    let ipfsMetadata: IPFSMetadata | null = null;
    if (chatbot.chatbot_nfts && chatbot.chatbot_nfts.length > 0) {
      const nftData = chatbot.chatbot_nfts[0]; // Get the first NFT
      if (nftData.metadata_ipfs_hash) {
        console.log("Fetching IPFS metadata for hash:", nftData.metadata_ipfs_hash);
        ipfsMetadata = await fetchIPFSMetadata(nftData.metadata_ipfs_hash);
        if (ipfsMetadata) {
          console.log("Successfully loaded NFT metadata for chatbot:", ipfsMetadata.name);
        } else {
          console.log("Failed to load IPFS metadata, falling back to regular chatbot characteristics");
        }
      }
    } else {
      console.log("No NFT data found for chatbot, using regular characteristics");
    }

    const messages: ChatHistory = (messageData.data?.chat_sessions?.[0]?.messages || []).map((msg: { sender: string; content: string }) => ({
      sender: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }));

    // 4. --- Construct the Request for Gemini with Enhanced Context ---
    const enhancedPrompt = buildEnhancedSystemPrompt(chatbot, ipfsMetadata);
    const systemInstruction = {
      role: 'system',
      parts: [{
        text: `You are a helpful assistant for ${name}. ${enhancedPrompt}If a question is outside this scope, politely inform the user that you can only answer questions related to the provided information. Use Emojis and tables to format your responses where it makes sense.`,
      }],
    };
    const contents = formatForGemini(messages, content);

    // 5. --- Call the Google Gemini API with Streaming ---
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}&alt=sse`;

    const geminiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction,
            contents,
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 2048, // Increased for potentially longer streamed responses
            }
        }),
    });

    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.json();
        console.error("Gemini API Error:", errorBody);
        return NextResponse.json({ error: "Failed to get response from AI service.", details: errorBody }, { status: geminiResponse.status });
    }

    // 6. --- Transform and Stream the Response ---
    // Create a TransformStream to parse the SSE format from Gemini and extract the text
    const reader = geminiResponse.body!.getReader();
    let fullAiResponse = ''; // Store the complete AI response

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Save the complete AI response to database when streaming is done
            if (fullAiResponse.trim()) {
              try {
                await serveClient.mutate({
                  mutation: INSERT_MESSAGE,
                  variables: {
                    chat_session_id: chat_session_id,
                    content: fullAiResponse.trim(),
                    sender: "ai"
                  }
                });
                console.log("AI response saved to database");
              } catch (error) {
                console.error("Error saving AI response:", error);
              }
            }
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last, possibly incomplete, line

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6));
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  fullAiResponse += text; // Accumulate the full response
                  controller.enqueue(new TextEncoder().encode(text));
                }
              } catch (e) {
                console.error('Failed to parse stream chunk:', e);
              }
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    // 7. --- General Error Handling ---
    console.error("Error in POST /api/send-message:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to generate response.", details: errorMessage }, { status: 500 });
  }
}
