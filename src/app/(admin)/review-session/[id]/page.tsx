import { GET_CHAT_SESSION_MESSAGES } from '../../../../../graphql/queries/queries';
import { GetChatSessionMessagesResponses, GetChatSessionMessagesVariables } from '../../../../../types/types';
import { serveClient } from '@/lib/server/serverClient';
import Messages from '@/components/Messages';

export const dynamic = 'force-dynamic'

async function ReviewSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await serveClient.query<GetChatSessionMessagesResponses, GetChatSessionMessagesVariables>({
    query: GET_CHAT_SESSION_MESSAGES,
    variables: { id: parseInt(id) },
  });

  const session = data?.chat_sessions?.[0];

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <section className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600 font-medium">Session not found or invalid ID provided.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-10 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="bg-white shadow-2xl rounded-3xl p-6 md:p-10 space-y-6 transition-all duration-300">
        <header>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900">🗒️ Session Review</h1>
          <p className="text-sm text-gray-500 mt-2">
            Started on{' '}
            <span className="font-medium text-gray-700">
              {new Date(session.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </p>
        </header>
        <section className="border-t border-gray-200 pt-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            💬 Conversation between{' '}
            <span className="text-indigo-600 font-bold">{session.chatbot.name}</span> &{' '}
            <span className="font-extrabold text-indigo-800">{session.guest.name}</span>{' '}
            <span className="text-gray-500 text-sm">({session.guest.email})</span>
          </h2>
        </section>

        <section className="relative mt-4">
          <div className="bg-gray-50 rounded-xl p-4 max-h-[65vh] overflow-y-auto custom-scrollbar shadow-inner transition-all">
            <div className="sticky top-0 z-10 bg-gray-50 p-2 border-b border-gray-200 text-sm text-gray-600 font-medium">
              Messages
            </div>
            <Messages messages={session.messages} chatbotName={session.chatbot.name} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default ReviewSession;
