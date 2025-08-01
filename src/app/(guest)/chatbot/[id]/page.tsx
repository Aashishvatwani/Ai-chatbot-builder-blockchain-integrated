'use client'
import { useQuery } from '@apollo/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import Avatar from "@/components/Avatar"
import { MessagesByChatSessionIdVariables, MessagesByChatSessionIdResponse, GetChatbotByIdVariables } from './../../../../../types/types';
import { GET_CHATPODS_BY_ID, GET_MESSAGES_BY_SESSION_ID } from "../../../../../graphql/queries/queries"
import { z } from "zod"
import { Message } from './../../../../../types/types'
import Messages from '@/components/Messages'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import startNewChat from '@/lib/startNewChat'
import { GetChatbotResponse } from './../../../../../types/types';

const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty")
});

function Chatbotpage() {
  const params = useParams();
  const [chatbotId, setChatbotId] = useState<number>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [chatId, setChatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Handle params asynchronously
  useEffect(() => {
    const handleParams = async () => {
      const resolvedParams = await params;
      if (resolvedParams.id) {
        setChatbotId(parseInt(resolvedParams.id as string));
      }
    };
    handleParams();
  }, [params]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: ''
    }
  });

  const { data: chatBotData } = useQuery<GetChatbotResponse, GetChatbotByIdVariables>(GET_CHATPODS_BY_ID, {
    variables: { id: chatbotId },
    skip: !chatbotId,
  });

  const { data: initialMessagesData, refetch: refetchMessages } = useQuery<MessagesByChatSessionIdResponse, MessagesByChatSessionIdVariables>(
    GET_MESSAGES_BY_SESSION_ID, {
    variables: { id: chatId! },
    skip: !chatId,
  });

  const handleInformationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    try {
      const newChatId = await startNewChat(name, email, chatbotId);
      setChatId(newChatId);
      setIsOpen(false);
    } catch (error) {
      console.error("Error starting chat:", error);
      // Optionally, show an error to the user
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialMessagesData?.chat_sessions[0]?.messages) {
      // Sort messages by created_at to ensure proper order
      const sortedMessages = [...initialMessagesData.chat_sessions[0].messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sortedMessages);
    }
  }, [initialMessagesData]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!chatId) {
      console.error("Chat ID is not set");
      return;
    }

    const { message: formMessage } = values;
    form.reset();

    // Optimistically add user message to the UI
    const userMessage: Message = {
      id: Date.now(),
      chat_session_id: chatId,
      content: formMessage,
      created_at: new Date().toISOString(),
      sender: "user"
    };

    // Add a placeholder for the AI's response
    const aiPlaceholderMessage: Message = {
      id: Date.now() + 1,
      chat_session_id: chatId,
      content: "", // Start with empty content
      created_at: new Date().toISOString(),
      sender: "ai"
    };
    
    setMessages((prev) => [...prev, userMessage, aiPlaceholderMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          chat_session_id: chatId,
          chatbot_id: chatbotId,
          content: formMessage
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // --- Handle the Stream ---
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Stream finished - refetch messages from database to ensure sync
          try {
            await refetchMessages();
          } catch (error) {
            console.error("Error refetching messages:", error);
          }
          break; // Stream finished
        }
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Update the content of the AI placeholder message with the new chunk
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === aiPlaceholderMessage.id 
              ? { ...msg, content: msg.content + chunk } 
              : msg
          )
        );
      }

    } catch (error) {
      console.error("Error sending message:", error);
      // Update the placeholder to show an error message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === aiPlaceholderMessage.id 
            ? { ...msg, content: "Sorry, something went wrong. Please try again." } 
            : msg
        )
      );
      // Still try to refetch to get any messages that might have been saved
      try {
        await refetchMessages();
      } catch (refetchError) {
        console.error("Error refetching messages after error:", refetchError);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-500">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleInformationSubmit}>
            <DialogHeader>
              <DialogTitle className="text-center">Welcome!</DialogTitle>
              <DialogDescription className="text-center">
                Please enter your details to start the chat.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!name || !email || loading}>
                {loading ? "Starting..." : "Start Chat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto bg-white shadow-lg">
        <div className="sticky top-0 z-10 flex items-center gap-4 bg-[#4D7DFB] text-white px-6 py-4">
          <Avatar seed={chatBotData?.chatbots?.[0]?.name || "default"} />
          <div>
            <h1 className="text-lg font-semibold">
              {chatBotData?.chatbots?.[0]?.name || "ChatBot"}
            </h1>
            <div className="flex items-center gap-1 text-sm text-white/80">
              <Zap className="h-4 w-4" />
              <span>Typically replies instantly</span>
            </div>
          </div>
        </div>

        <Messages
          messages={messages}
          chatbotName={chatBotData?.chatbots?.[0]?.name || "ChatBot"}
        />

        <div className="mt-auto p-4 bg-white border-t">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">Message</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Type your message..."
                        disabled={loading || !chatId}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading || !form.formState.isValid || !chatId}>
                {loading ? "..." : "Send"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Chatbotpage;
