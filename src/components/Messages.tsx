'use client';

import { usePathname } from 'next/navigation';
import { Message } from '../../types/types';
import Avatar from './Avatar';
import { UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function Messages({ messages, chatbotName }: { messages: Message[]; chatbotName: string }) {
  const path = usePathname();
  const isReviewsPage = path.includes('review-sessions');

  

  return (
    <div className="flex flex-col space-y-4 p-4 max-w-2xl mx-auto">
      {messages.map((message, index) => {
        const messageKey = message.id || `message-${index}`;
        const isSender = message.sender !== 'user';

        return (
          <motion.div
            key={messageKey}
            className={`flex items-start gap-3 ${isSender ? 'justify-start' : 'justify-end'}`}
            initial="hidden"
            animate="visible"
           
          >
            {isSender && (
              <Avatar
                seed={chatbotName}
                class-Name="h-9 w-9 bg-white rounded-full border-2 border-[#2991EE] flex-shrink-0"
              />
            )}

            <div
              className={`relative px-4 py-2 rounded-xl max-w-[75%] shadow-md break-words overflow-x-auto ${
                isSender
                  ? 'bg-gradient-to-br from-[#2991EE] to-[#1a6bbd] text-white rounded-tl-none'
                  : 'bg-gray-200 text-gray-800 rounded-tr-none'
              } prose prose-sm prose-invert dark:prose-invert`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-200 hover:text-white">
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-800 text-green-300 px-1 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ),
                  li: ({ children }) => <li className="list-disc list-inside">{children}</li>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto">
                      <table className="table-auto border border-gray-300">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border px-2 py-1 bg-gray-100 text-gray-800">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border px-2 py-1 text-gray-700">{children}</td>
                  ),
                  del: ({ children }) => <del className="text-red-400">{children}</del>,
                  input: ({ checked }) => (
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      className="mr-2 accent-blue-500"
                    />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>

              {isReviewsPage && (
                <p
                  className={`absolute ${
                    isSender ? '-bottom-5 left-0' : '-bottom-5 right-0'
                  } text-xs text-gray-400`}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            {!isSender && (
              <UserCircle className="h-9 w-9 text-[#2991EE] flex-shrink-0" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default Messages;
