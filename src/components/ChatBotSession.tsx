"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Chatbot } from "../../types/types";
import Link from "next/link";

function ChatBotSession({ chatbots }: { chatbots: Chatbot[] }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl"> {/* Added a container */}
      <Accordion type="single" collapsible className="w-full"> {/* Full width */}
        {chatbots.map((chatbot) => {
          const hasSessions = chatbot.chat_sessions.length > 0;
          return (
            <AccordionItem key={chatbot.id} value={`item-${chatbot.id}`} className="border-b border-gray-200"> {/* Cleaner border */}
              <AccordionTrigger
                className={`flex justify-between items-center py-4 px-6 ${
                  hasSessions
                    ? "text-gray-800 hover:bg-gray-50 data-[state=open]:bg-blue-50 data-[state=open]:text-blue-700" // Hover and active state
                    : "text-gray-500 cursor-default" // Styled for no sessions
                }`}
                // Disable trigger if no sessions
                onClick={(e) => !hasSessions && e.preventDefault()}
              >
                <div className="flex items-center space-x-3">
                  {/* Optional: Add an icon here */}
                  <span className="font-semibold text-lg">{chatbot.name}</span>
                  {hasSessions ? (
                    <span className="text-sm text-gray-500 ml-2">
                      ({chatbot.chat_sessions.length} sessions)
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">
                      (No sessions)
                    </span>
                  )}
                </div>
                {!hasSessions && (
                  <span className="ml-2 text-gray-400">
                    {/* Optional: Add an "info" icon here if using a dedicated icon library */}
                    <svg /* ... your info icon SVG */ />
                  </span>
                )}
              </AccordionTrigger>

              {hasSessions && (
                <AccordionContent className="space-y-4 p-4 bg-blue-50 rounded-b-lg"> {/* Slightly different background */}
                  {chatbot.chat_sessions.map((session) => (
                    <Link
                      href={`/review-session/${session.id}`}
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-white shadow-sm rounded-lg hover:shadow-md transition-all duration-200 group" // Better styling for cards
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0"> {/* Responsive layout */}
                        <p className="text-base font-medium text-gray-800">
                          {session.guest?.name || "Anonymous"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {session.guest?.email || "No email provided"}
                        </p>
                        <p className="text-xs text-gray-400 md:ml-auto"> {/* Align date to right on larger screens */}
                          {new Date(session.created_at).toLocaleDateString()}{" "}
                          {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <svg /* ... your right arrow icon SVG for link */
                        className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform"
                      />
                    </Link>
                  ))}
                </AccordionContent>
              )}
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export default ChatBotSession;