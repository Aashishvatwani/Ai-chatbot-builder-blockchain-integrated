import { auth } from "@clerk/nextjs/server";
import { GET_USER_CHATPODS } from "../../../../graphql/queries/queries";
import { serveClient } from "@/lib/server/serverClient";
import { GetUserChatbotsResponse, GetUserChatbotsVariables } from "../../../../types/types";
import ChatBotSessions from "@/components/ChatBotSession";
import { Bot } from "lucide-react"; // Optional icon

async function ReviewSession() {
  const { userId } = await auth();
  if (!userId) return;

  const {
    data: { chatbots },
  } = await serveClient.query<GetUserChatbotsResponse, GetUserChatbotsVariables>({
    query: GET_USER_CHATPODS,
    variables: { userId },
  });

  const sortedChatbots = [...chatbots].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="flex-1 w-full px-4 md:px-10 py-10 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="text-[#2991EE] h-6 w-6" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Chat Sessions</h1>
          </div>
          <p className="text-gray-600 flex justify-center text-sm md:text-base">
            Review all the conversations your chatbots have had with customers.
          </p>
        </div>

        {/* Chat session list */}
        <div className="space-y-6">
          <ChatBotSessions chatbots={sortedChatbots} />
        </div>
      </div>
    </div>
  );
}

export default ReviewSession;
