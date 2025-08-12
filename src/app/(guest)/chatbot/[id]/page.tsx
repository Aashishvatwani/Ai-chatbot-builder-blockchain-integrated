'use client'

import { useQuery } from '@apollo/client'
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useWeb3 } from '@/components/Web3Provider'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from "zod"
import { toast } from 'sonner'

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'

// Custom Components
import Avatar from "@/components/Avatar"
import Messages from '@/components/Messages'
import PaymentModal from '@/components/PaymentModal'
import PaymentDebugger from '@/components/PaymentDebugger'
import CreditsDashboard from '@/components/CreditsDashboard'
import BuyChatTokens from '@/components/BuyChatTokens'
import DailyStatus from '@/components/DailyStatus'

// Icons
import { Zap, Coins, Shield, Info, Wallet } from "lucide-react"

// GraphQL and Types
import { GET_CHATPODS_BY_ID, GET_MESSAGES_BY_SESSION_ID } from "../../../../../graphql/queries/queries"
import { MessagesByChatSessionIdVariables, MessagesByChatSessionIdResponse, GetChatbotByIdVariables } from '../../../../../types/types';
import { Message } from '../../../../../types/types'
import { GetChatbotResponse } from '../../../../../types/types';
import startNewChat from '@/lib/startNewChat'

const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty")
});

export default function EnhancedChatbotPage() {
  const params = useParams();
  const { 
    isConnected, 
    account, 
    tokenBalance,
    ethBalance,
    messageCosts,
    connectWallet, 
    processMessagePayment,
    mintDemoTokens,
    refreshBalance 
  } = useWeb3();

  // State Management
  const [chatbotId, setChatbotId] = useState<number>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string>("");
  const [isNFTBot, setIsNFTBot] = useState(false);
  const [creatorAddress, setCreatorAddress] = useState<string>("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [mintingTokens, setMintingTokens] = useState(false);

  // Constants
  const MESSAGE_COST = 0.001; // Fixed 0.001 CHAT tokens per message for direct transfer
  const ETH_COST = parseFloat(messageCosts.ethCost) || 0.0001; // ETH gas cost
  const CREATOR_REWARD = MESSAGE_COST * 0.8; // 80% to creator (handled off-chain for direct transfers)

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

  // GraphQL Queries
  const { data: chatBotData, loading: chatbotLoading } = useQuery<GetChatbotResponse, GetChatbotByIdVariables>(GET_CHATPODS_BY_ID, {
    variables: { id: chatbotId },
    skip: !chatbotId,
  });

  const { data: initialMessagesData, refetch: refetchMessages } = useQuery<MessagesByChatSessionIdResponse, MessagesByChatSessionIdVariables>(
    GET_MESSAGES_BY_SESSION_ID, {
    variables: { id: chatId! },
    skip: !chatId,
  });

  // Check if this is an NFT bot
  useEffect(() => {
    if (chatBotData?.chatbots?.[0]) {
      const chatbot = chatBotData.chatbots[0];
      // Check if chatbot has IPFS hash or NFT metadata (indicating it's an NFT)
      const hasIPFS = !!chatbot.ipfs_hash;
      setIsNFTBot(hasIPFS);
      
      // In a real implementation, you'd fetch the creator address from blockchain
      // For now, we'll use a placeholder
      if (hasIPFS) {
        setCreatorAddress("0x37700500A14540Ba973d98FE76bdb1c7aC6327A4"); // Placeholder
      }
    }
  }, [chatBotData]);

  // Handle welcome form submission
  const handleInformationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    try {
      const newChatId = await startNewChat(name, email, chatbotId);
      setChatId(newChatId);
      setIsWelcomeOpen(false);
      
      // Show info about NFT bot payment system
      if (isNFTBot) {
        toast.info(`This is an NFT chatbot. Messages cost ${MESSAGE_COST} CHAT tokens.`, {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update messages when data changes
  useEffect(() => {
    if (initialMessagesData?.chat_sessions[0]?.messages) {
      const sortedMessages = [...initialMessagesData.chat_sessions[0].messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sortedMessages);
    }
  }, [initialMessagesData]);

  // Handle payment confirmation
  const handlePaymentConfirm = async () => {
    if (!isNFTBot) {
      // Free chat - proceed directly
      await sendMessage();
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    const balance = parseFloat(tokenBalance);
    if (balance < MESSAGE_COST) {
      toast.error(`Insufficient CHAT tokens. You need ${MESSAGE_COST.toFixed(4)} CHAT but only have ${balance.toFixed(4)}.`);
      return;
    }

    const ethBal = parseFloat(ethBalance);
    if (ethBal < ETH_COST) {
      toast.error(`Insufficient ETH for gas. You need ~${ETH_COST.toFixed(6)} ETH for transaction fees.`);
      return;
    }

    setPaymentProcessing(true);
    try {
      // Get IPFS hash from chatbot data
      const chatbot = chatBotData?.chatbots?.[0];
      const ipfsHash = chatbot?.ipfs_hash;
      
      // Process payment through smart contract with IPFS hash to get NFT token ID
      const success = await processMessagePayment(chatbotId, ipfsHash, chatId || undefined);
      
      if (success) {
        toast.success(`Payment successful! ${MESSAGE_COST.toFixed(4)} CHAT + ${ETH_COST.toFixed(6)} ETH deducted. ${CREATOR_REWARD.toFixed(4)} CHAT sent to creator.`);
        await refreshBalance();
        await sendMessage();
      } else {
        toast.error("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please check your wallet and try again.");
    } finally {
      setPaymentProcessing(false);
      setIsPaymentModalOpen(false);
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!chatId || !pendingMessage) return;

    const messageToSend = pendingMessage;
    setPendingMessage("");
    form.reset();

    // Optimistically add user message
    const userMessage: Message = {
      id: Date.now(),
      chat_session_id: chatId,
      content: messageToSend,
      created_at: new Date().toISOString(),
      sender: "user"
    };

    const aiPlaceholderMessage: Message = {
      id: Date.now() + 1,
      chat_session_id: chatId,
      content: "",
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
          content: messageToSend
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          await refetchMessages();
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        
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
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === aiPlaceholderMessage.id 
            ? { ...msg, content: "Sorry, something went wrong. Please try again." } 
            : msg
        )
      );
      await refetchMessages();
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!chatId) {
      console.error("Chat ID is not set");
      return;
    }

    const messageContent = values.message;
    setPendingMessage(messageContent);

    // For NFT bots, show payment modal
    if (isNFTBot) {
      setIsPaymentModalOpen(true);
    } else {
      // Free chat - send directly
      await sendMessage();
    }
  };

  const chatbotName = chatBotData?.chatbots?.[0]?.name || "ChatBot";
  const hasEnoughBalance = isConnected && parseFloat(tokenBalance) >= MESSAGE_COST;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex flex-col md:flex-row">
      {/* Sidebar - collapses on mobile */}
      <aside className="w-full md:w-80 bg-white border-r shadow-lg p-4 space-y-4 flex-shrink-0 md:block hidden md:flex flex-col">
        <CreditsDashboard />
        <DailyStatus />
        <BuyChatTokens />
      </aside>
      {/* Mobile Sidebar Toggle */}
      <aside className="w-full bg-white border-b shadow-lg p-2 flex md:hidden items-center justify-between sticky top-0 z-20">
        <span className="font-bold text-lg text-indigo-700">Dashboard</span>
        {/* Optionally add a menu button for mobile navigation */}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col items-center w-full">
        {/* Welcome Dialog */}
        <Dialog open={isWelcomeOpen} onOpenChange={setIsWelcomeOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleInformationSubmit}>
              <DialogHeader>
                <DialogTitle className="text-center">Welcome!</DialogTitle>
                <DialogDescription className="text-center">
                  Please enter your details to start the chat.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!name || !email || loading} className="w-full">
                  {loading ? "Starting..." : "Start Chat"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirm={handlePaymentConfirm}
          chatbotName={chatbotName}
          isNFTBot={isNFTBot}
          userBalance={tokenBalance}
          messageCost={MESSAGE_COST}
          creatorAddress={creatorAddress}
          isProcessing={paymentProcessing}
        />

        {/* Main Chat Interface */}
        <section className="flex-1 flex flex-col w-full max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden mt-4 mb-4">
          {/* Header */}
          <div className="sticky top-0 z-10 flex flex-col sm:flex-row items-center gap-4 bg-[#4D7DFB] text-white px-4 py-4">
            <Avatar seed={chatbotName} />
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold">{chatbotName}</h1>
                {isNFTBot && (
                  <Badge variant="secondary" className="bg-yellow-500 text-yellow-900">
                    <Coins className="h-3 w-3 mr-1" />
                    NFT
                  </Badge>
                )}
                {/* Version indicator for debugging */}
                <Badge variant="outline" className="bg-red-500 text-white text-xs">
                  v2.0-EMERGENCY-FIX
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-white/80 mt-1">
                <Zap className="h-4 w-4" />
                <span>
                  {isNFTBot 
                    ? `⭐ Premium bot • ${MESSAGE_COST.toFixed(4)} CHAT credits per message`
                    : "Free chat • Typically replies instantly"
                  }
                </span>
              </div>
            </div>
            {/* Wallet Status in Header */}
            {isNFTBot && (
              <div className="text-right w-full sm:w-auto">
                {isConnected ? (
                  <div className="space-y-1">
                    <div className="text-xs text-white/80">Your Balance</div>
                    <div className="space-y-1">
                      <Badge 
                        variant={hasEnoughBalance ? "secondary" : "destructive"}
                        className="bg-white/20 block"
                      >
                        {parseFloat(tokenBalance).toFixed(4)} CHAT
                      </Badge>
                      <Badge 
                        variant="secondary"
                        className="bg-white/20 block text-xs"
                      >
                        {parseFloat(ethBalance).toFixed(6)} ETH
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={connectWallet}
                    className="text-blue-600 border-white/30"
                  >
                    <Wallet className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* NFT Bot Info Banner */}
          {isNFTBot && (
            <div className="px-4 py-3 bg-blue-50 border-b space-y-3">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>🎮 Premium Chat Experience:</strong> This bot uses <strong>CHAT credits</strong> for messaging. 
                  Each message costs <strong>{MESSAGE_COST.toFixed(4)} CHAT credits</strong>. 
                  <strong>Earn credits through engagement and referrals!</strong>
                  {!isConnected && (
                    <Button 
                      size="sm" 
                      variant="link" 
                      onClick={connectWallet}
                      className="ml-2 p-0 h-auto"
                    >
                      Connect wallet to start earning
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
              {/* Debug Component - Remove in production */}
              <PaymentDebugger chatbotId={chatbotId} />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-4">
            <Messages
              messages={messages}
              chatbotName={chatbotName}
            />
          </div>

          {/* Input Form */}
          <div className="mt-auto p-2 sm:p-4 bg-white border-t">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-center gap-2 w-full">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1 w-full">
                      <FormLabel className="sr-only">Message</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            isNFTBot 
                              ? `Type your message... (${MESSAGE_COST} CHAT credits)`
                              : "Type your message..."
                          }
                          disabled={loading || !chatId || (isNFTBot && !isConnected)}
                          className="w-full"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={
                    loading || 
                    !form.formState.isValid || 
                    !chatId || 
                    (isNFTBot && (!isConnected || !hasEnoughBalance))
                  }
                  className="w-full sm:w-auto"
                >
                  {loading ? "..." : isNFTBot ? `Send (${MESSAGE_COST} credits)` : "Send"}
                </Button>
              </form>
            </Form>
            {/* Helper Text */}
            {isNFTBot && (
              <div className="mt-2 text-xs text-gray-500 text-center space-y-2">
                {!isConnected ? (
                  "� Connect your wallet to start earning CHAT credits"
                ) : !hasEnoughBalance ? (
                  <div className="space-y-2">
                    <div>⭐ You need at least {MESSAGE_COST} CHAT credits to send a message</div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={mintingTokens}
                      onClick={async () => {
                        setMintingTokens(true);
                        try {
                          const success = await mintDemoTokens(0.01);
                          if (success) {
                            toast.success("🎉 You earned 0.01 CHAT credits! Keep engaging to earn more!");
                            await refreshBalance();
                          }
                        } catch (error) {
                          toast.error("Failed to earn credits. Please try again.");
                        } finally {
                          setMintingTokens(false);
                        }
                      }}
                      className="text-xs"
                    >
                      Earn 0.01 CHAT
                    </Button>
                  </div>
                ) : (
                  `💎 Each message earns the creator ${CREATOR_REWARD} CHAT credits`
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}