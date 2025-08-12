import { GET_CHAT_SESSION_MESSAGES } from '../../../../../graphql/queries/queries';
import { GetChatSessionMessagesResponses, GetChatSessionMessagesVariables } from '../../../../../types/types';
import { serveClient } from '@/lib/server/serverClient';
import Messages from '@/components/Messages';
import React from 'react';

export const dynamic = 'force-dynamic';

function DailyBalanceStatic() {
  // Calculate daily balance once
  const today = new Date().toISOString().slice(0, 10);
  let balance = 0;

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('daily_balance_date');
    if (stored === today) {
      balance = Number(localStorage.getItem('daily_balance')) || 0;
    } else {
      localStorage.setItem('daily_balance_date', today);
      localStorage.setItem('daily_balance', '0');
      balance = 0;
    }
  }

  return (
    <div className="flex items-center gap-2 bg-indigo-100 rounded-xl px-5 py-2 shadow-lg font-semibold text-indigo-800 w-fit border border-indigo-200">
      <span role="img" aria-label="dashboard" className="text-2xl">📊</span>
      <span className="text-indigo-900">Daily Balance:</span>
      <span className="ml-1 text-lg font-bold">{balance}</span>
    </div>
  );
}

async function ReviewSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data } = await serveClient.query<GetChatSessionMessagesResponses, GetChatSessionMessagesVariables>({
    query: GET_CHAT_SESSION_MESSAGES,
    variables: { id: parseInt(id) },
  });

  const session = data?.chat_sessions?.[0];

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <section className="p-6 bg-red-50 border border-red-200 rounded-2xl shadow-md">
          <p className="text-red-700 font-semibold">Session not found or invalid ID provided.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 bg-gradient-to-br from-gray-50 to-white min-h-screen flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 flex items-center gap-3">
              <span role="img" aria-label="dashboard" className="text-3xl">📋</span>
              Dashboard & Session Review
            </h1>
            <p className="text-sm text-gray-500 mt-1">
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
          </div>
          <DailyBalanceStatic />
        </header>

        {/* Conversation Info */}
        <section>
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            💬 Conversation between{' '}
            <span className="text-indigo-600 font-bold">{session.chatbot.name}</span> &{' '}
            <span className="font-extrabold text-indigo-800">{session.guest.name}</span>{' '}
            <span className="text-gray-500 text-sm">({session.guest.email})</span>
          </h2>
        </section>

        {/* Messages */}
        <section className="relative">
          <div className="bg-gray-50 rounded-xl p-4 max-h-[70vh] overflow-y-auto custom-scrollbar shadow-inner border border-gray-200">
            <div className="sticky top-0 z-10 bg-gray-100 p-2 border-b border-gray-200 text-sm text-gray-600 font-medium">
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
