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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Calendar, MessageSquare, Settings, Plus } from "lucide-react";

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
    <div className="flex-1 px-6 py-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-600" />
            Your Chatbots
          </h1>
          <p className="text-gray-600 mt-2">Manage your AI assistants and their configurations</p>
        </div>
        <Link href="/create-chatpod">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Chatbot
          </Button>
        </Link>
      </div>

      {sortedChatbots.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No chatbots yet</h3>
            <p className="text-gray-600 mb-6">Create your first AI assistant to get started</p>
            <Link href="/create-chatpod">
              <Button size="lg" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Chatbot
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {sortedChatbots.map((chatbot) => {
              const totalMessages = chatbot.chat_sessions.reduce(
                (acc, session) => acc + (session.messages?.length || 0), 
                0
              );
              
              return (
                <Card key={chatbot.id} className="hover:shadow-lg transition-all duration-200 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar seed={chatbot.name} />
                        <div>
                          <CardTitle className="text-lg">{chatbot.name}</CardTitle>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(chatbot.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Regular AI</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Characteristics */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">🧠 Characteristics</h4>
                      <div className="flex flex-wrap gap-1">
                        {chatbot.chatbot_characteristics.slice(0, 3).map((c) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">
                            {c.content.length > 15 ? `${c.content.slice(0, 15)}...` : c.content}
                          </Badge>
                        ))}
                        {chatbot.chatbot_characteristics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{chatbot.chatbot_characteristics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Sessions:</span>
                        <span className="font-medium">{chatbot.chat_sessions.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Messages:</span>
                        <span className="font-medium">{totalMessages}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/edit-chatpod/${chatbot.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
                          <Settings className="h-3 w-3" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/review-session?chatbotId=${chatbot.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          Sessions
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📈 Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{sortedChatbots.length}</div>
                  <div className="text-sm text-gray-600">Total Chatbots</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {sortedChatbots.reduce((acc, bot) => acc + bot.chat_sessions.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {sortedChatbots.reduce((acc, bot) => 
                      acc + bot.chat_sessions.reduce((sessionAcc, session) => 
                        sessionAcc + (session.messages?.length || 0), 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {sortedChatbots.reduce((acc, bot) => acc + bot.chatbot_characteristics.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Characteristics</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default ViewChatpods;
