'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Coins, 
  Zap, 
  Shield, 
  Star,
  Users,
  TrendingUp,
  ExternalLink 
} from 'lucide-react';
import Link from 'next/link';

interface ChatbotDemo {
  id: number;
  name: string;
  description: string;
  type: 'free' | 'nft';
  specialization: string;
  messageCount: number;
  rating: number;
  creator?: string;
  features: string[];
}

const demoChatbots: ChatbotDemo[] = [
  {
    id: 1,
    name: "General Assistant",
    description: "A helpful AI assistant for everyday questions and tasks",
    type: 'free',
    specialization: 'General Help',
    messageCount: 1250,
    rating: 4.2,
    features: ['Basic Q&A', 'General Knowledge', 'Simple Tasks']
  },
  {
    id: 2,
    name: "Code Master Pro",
    description: "Expert programming assistant with deep technical knowledge",
    type: 'nft',
    specialization: 'Programming',
    messageCount: 890,
    rating: 4.9,
    creator: '0x742d35Cc...ABCDEF',
    features: ['Code Debugging', 'Architecture Design', 'Best Practices', 'Multiple Languages']
  },
  {
    id: 3,
    name: "Creative Writer",
    description: "AI storyteller and content creator for all your writing needs",
    type: 'nft',
    specialization: 'Creative Writing',
    messageCount: 567,
    rating: 4.7,
    creator: '0x123e45fa...789012',
    features: ['Story Writing', 'Blog Posts', 'Marketing Copy', 'Poetry']
  },
  {
    id: 4,
    name: "Study Buddy",
    description: "Educational assistant for students and learners",
    type: 'free',
    specialization: 'Education',
    messageCount: 2100,
    rating: 4.1,
    features: ['Homework Help', 'Explanations', 'Study Tips']
  }
];

export default function ChatbotDirectory() {
  const [selectedType, setSelectedType] = useState<'all' | 'free' | 'nft'>('all');

  const filteredBots = demoChatbots.filter(bot => 
    selectedType === 'all' || bot.type === selectedType
  );

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">🤖 Chat with AI Bots</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose between free community bots or premium NFT bots with specialized expertise
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <MessageCircle className="h-5 w-5" />
              Free Chatbots
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700">
            <ul className="space-y-2 text-sm">
              <li>• No payment required</li>
              <li>• Basic AI capabilities</li>
              <li>• Community-maintained</li>
              <li>• Perfect for simple questions</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Coins className="h-5 w-5" />
              NFT Chatbots
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ul className="space-y-2 text-sm">
              <li>• 10 CHAT tokens per message</li>
              <li>• Specialized expertise</li>
              <li>• Creator-owned & maintained</li>
              <li>• Premium quality responses</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-center gap-2">
        <Button 
          variant={selectedType === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedType('all')}
        >
          All Bots
        </Button>
        <Button 
          variant={selectedType === 'free' ? 'default' : 'outline'}
          onClick={() => setSelectedType('free')}
        >
          Free Bots
        </Button>
        <Button 
          variant={selectedType === 'nft' ? 'default' : 'outline'}
          onClick={() => setSelectedType('nft')}
        >
          NFT Bots
        </Button>
      </div>

      {/* Chatbot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBots.map((bot) => (
          <Card key={bot.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{bot.name}</CardTitle>
                  <CardDescription>{bot.specialization}</CardDescription>
                </div>
                {bot.type === 'nft' ? (
                  <Badge className="bg-blue-600">
                    <Coins className="h-3 w-3 mr-1" />
                    NFT
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Free
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{bot.description}</p>
              
              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{bot.messageCount.toLocaleString()} chats</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{bot.rating}/5</span>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-sm font-medium mb-2">Features:</h4>
                <div className="flex flex-wrap gap-1">
                  {bot.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Creator (for NFT bots) */}
              {bot.creator && (
                <div className="text-sm">
                  <span className="text-gray-500">Creator: </span>
                  <Badge variant="outline" className="text-xs">
                    {formatAddress(bot.creator)}
                  </Badge>
                </div>
              )}

              {/* Cost Info */}
              <Alert className={bot.type === 'nft' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}>
                <div className="flex items-center gap-2">
                  {bot.type === 'nft' ? (
                    <>
                      <Coins className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        <strong>10 CHAT</strong> per message
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        <strong>Free</strong> to use
                      </span>
                    </>
                  )}
                </div>
              </Alert>

              {/* Chat Button */}
              <Button asChild className="w-full">
                <Link href={`/chatbot/${bot.id}`}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {bot.type === 'nft' ? 'Chat (10 CHAT)' : 'Chat for Free'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting Started Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            How to Get Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold">Choose a Bot</h3>
              <p className="text-sm text-gray-600">
                Pick free or NFT bot based on your needs
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold">Connect & Pay</h3>
              <p className="text-sm text-gray-600">
                For NFT bots, connect wallet and pay CHAT tokens
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold">Start Chatting</h3>
              <p className="text-sm text-gray-600">
                Ask questions and get AI-powered responses
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" asChild>
              <Link href="/HOW_TO_CHAT_COMPLETE_GUIDE.md">
                <ExternalLink className="h-4 w-4 mr-2" />
                Complete Guide
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/create-chatpod">
                Create Your Own Bot
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
