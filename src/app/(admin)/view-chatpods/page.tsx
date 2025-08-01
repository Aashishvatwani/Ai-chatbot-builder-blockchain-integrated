import { auth } from "@clerk/nextjs/server";
import { serveClient } from "@/lib/server/serverClient";
import { Chatbot } from "../../../../types/types";
import {
  GetChatbotsByUserData,
  GetChatbotsByUserVariables,
} from "./../../../../types/types";
import { GET_CHATPODS_BY_USER } from "../../../../graphql/queries/queries";
import Link from "next/link";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

async function ViewChatpods() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-medium">
        Please log in to view your chatpods.
      </div>
    );
  }

  let chatbots: Chatbot[] = [];

  try {
    const { data } = await serveClient.query<GetChatbotsByUserData, GetChatbotsByUserVariables>({
      query: GET_CHATPODS_BY_USER,
      variables: { userId },
    });

    chatbots = data?.chatbots ?? [];
  } catch {
    return (
      <div className="text-center text-red-600 mt-10">
        Failed to load chatbots. Please try again later.
      </div>
    );
  }

  const sortedChatbots = [...chatbots].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="flex-1 px-6 py-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🤖 Your Chatbots</h1>

      {sortedChatbots.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">You have no active chatbots yet.</p>
          <Link
            href="/create-chatpod"
            className="inline-block mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
          >
            ➕ Create Chatbot
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {sortedChatbots.map((chatbot) => (
            <li
              key={chatbot.id}
              className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md bg-white p-5 transition"
            >
              <Link href={`/edit-chatpod/${chatbot.id}`}>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-4">
                    <Avatar seed={chatbot.name} />
                    <div>
                      <h2 className="text-xl font-semibold">{chatbot.name}</h2>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(chatbot.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700">🧠 Characteristics:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                      {chatbot.chatbot_characteristics.slice(0, 5).map((c) => (
                        <li key={c.id} className="break-words">
                          {c.content}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-sm text-gray-700">
                    <strong>📊 Sessions:</strong> {chatbot.chat_sessions.length}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ViewChatpods;
