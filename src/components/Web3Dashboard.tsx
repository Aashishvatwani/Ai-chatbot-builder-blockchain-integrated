'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from './Web3Provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Coins, Trophy, Zap, TrendingUp, MessageCircle, Calendar, User, Bug } from 'lucide-react';
import { web3Service } from '@/lib/web3Service';

interface ChatbotMetadata {
  name: string;
  characteristics: string[];
  conversationCount: number;
  createdAt: number;
  creator: string;
  totalEarnings: number;
}

interface EnhancedChatbotData {
  tokenId: string;
  metadata: ChatbotMetadata;
  formattedDate: string;
  formattedEarnings: string;
}

export default function Web3Dashboard() {
  const { 
    isConnected, 
    account, 
    tokenBalance, 
    userChatbots, 
    connectWallet,
    refreshBalance,
    refreshChatbots 
  } = useWeb3();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enhancedChatbots, setEnhancedChatbots] = useState<EnhancedChatbotData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalConversations: 0,
    totalEarnings: 0,
    totalChatbots: 0,
    averagePerBot: 0
  });
  const [debugInfo, setDebugInfo] = useState<{ nft: boolean; token: boolean } | null>(null);

  // Debug function
  const testConnection = async () => {
    try {
      const results = await web3Service.testContractConnection();
      setDebugInfo(results);
      console.log('Contract connection test results:', results);
    } catch (error) {
      console.error('Debug test failed:', error);
    }
  };

  // Process chatbot data and calculate stats
  useEffect(() => {
    if (userChatbots.length > 0) {
      const processed = userChatbots.map(chatbot => {
        // Extract metadata - handle different possible structures
        let metadata: ChatbotMetadata;
        
        if (chatbot.name && typeof chatbot.name === 'string') {
          // If the data is already in the expected format
          metadata = {
            name: chatbot.name as string,
            characteristics: (chatbot.characteristics as string[]) || [],
            conversationCount: Number(chatbot.conversationCount) || 0,
            createdAt: Number(chatbot.createdAt) || Date.now() / 1000,
            creator: (chatbot.creator as string) || account || '',
            totalEarnings: Number(chatbot.totalEarnings) || 0
          };
        } else {
          // If the data is wrapped in a metadata object or array
          const metadataObj = Array.isArray(chatbot) ? chatbot[1] : chatbot;
          metadata = {
            name: String(metadataObj?.name || 'Unknown Chatbot'),
            characteristics: Array.isArray(metadataObj?.characteristics) 
              ? metadataObj.characteristics 
              : [],
            conversationCount: Number(metadataObj?.conversationCount) || 0,
            createdAt: Number(metadataObj?.createdAt) || Date.now() / 1000,
            creator: String(metadataObj?.creator || account || ''),
            totalEarnings: Number(metadataObj?.totalEarnings) || 0
          };
        }

        return {
          tokenId: chatbot.tokenId,
          metadata,
          formattedDate: new Date(metadata.createdAt * 1000).toLocaleDateString(),
          formattedEarnings: (metadata.totalEarnings / 1e18).toFixed(4) // Convert from wei
        };
      });

      setEnhancedChatbots(processed);

      // Calculate total stats
      const stats = processed.reduce((acc, bot) => {
        acc.totalConversations += bot.metadata.conversationCount;
        acc.totalEarnings += Number(bot.formattedEarnings);
        acc.totalChatbots += 1;
        return acc;
      }, { totalConversations: 0, totalEarnings: 0, totalChatbots: 0, averagePerBot: 0 });

      stats.averagePerBot = stats.totalChatbots > 0 ? stats.totalEarnings / stats.totalChatbots : 0;
      setTotalStats(stats);
    } else {
      setEnhancedChatbots([]);
      setTotalStats({ totalConversations: 0, totalEarnings: 0, totalChatbots: 0, averagePerBot: 0 });
    }
  }, [userChatbots, account]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshBalance(), refreshChatbots()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-6 w-6" />
            Connect Your Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to access blockchain features and view your NFT chatbots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={connectWallet} className="w-full">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connected
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Address:</span>
            <Badge variant="secondary">{formatAddress(account!)}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Coins className="h-4 w-4" />
              CHAT Balance:
            </span>
            <Badge variant="default" className="text-lg">
              {parseFloat(tokenBalance).toFixed(2)} CHAT
            </Badge>
          </div>
          
          {/* Debug Section */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={testConnection}>
                <Bug className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
              {debugInfo && (
                <div className="flex gap-2">
                  <Badge variant={debugInfo.nft ? "default" : "destructive"}>
                    NFT: {debugInfo.nft ? "✓" : "✗"}
                  </Badge>
                  <Badge variant={debugInfo.token ? "default" : "destructive"}>
                    Token: {debugInfo.token ? "✓" : "✗"}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Stats */}
      {totalStats.totalChatbots > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Portfolio Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalStats.totalChatbots}</div>
                <div className="text-sm text-gray-600">NFT Chatbots</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalStats.totalConversations}</div>
                <div className="text-sm text-gray-600">Total Conversations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totalStats.totalEarnings.toFixed(4)}</div>
                <div className="text-sm text-gray-600">Total Earnings (CHAT)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{totalStats.averagePerBot.toFixed(4)}</div>
                <div className="text-sm text-gray-600">Avg per Bot</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NFT Chatbots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your NFT Chatbots ({enhancedChatbots.length})
          </CardTitle>
          <CardDescription>
            Chatbots you own as NFTs on the blockchain with real-time stats
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enhancedChatbots.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No NFT chatbots found</p>
              <p className="text-sm text-gray-400">Create and mint your first chatbot to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {enhancedChatbots.map((chatbot) => (
                <div key={chatbot.tokenId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{chatbot.metadata.name}</h3>
                    <Badge variant="outline" className="text-sm">
                      NFT #{chatbot.tokenId}
                    </Badge>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-semibold">{chatbot.metadata.conversationCount}</div>
                        <div className="text-xs text-gray-500">Conversations</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="font-semibold">{chatbot.formattedEarnings}</div>
                        <div className="text-xs text-gray-500">CHAT Earned</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="font-semibold text-sm">{chatbot.formattedDate}</div>
                        <div className="text-xs text-gray-500">Created</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="font-semibold text-sm">{formatAddress(chatbot.metadata.creator)}</div>
                        <div className="text-xs text-gray-500">Creator</div>
                      </div>
                    </div>
                  </div>

                  {/* Characteristics */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Characteristics:</p>
                    <div className="flex flex-wrap gap-2">
                      {chatbot.metadata.characteristics.length > 0 ? (
                        <>
                          {chatbot.metadata.characteristics.slice(0, 3).map((char, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {char.length > 20 ? `${char.slice(0, 20)}...` : char}
                            </Badge>
                          ))}
                          {chatbot.metadata.characteristics.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{chatbot.metadata.characteristics.length - 3} more
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 italic">No characteristics defined</span>
                      )}
                    </div>
                  </div>

                  {/* Performance Indicator */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Performance:</span>
                      <div className="flex items-center gap-1">
                        {chatbot.metadata.conversationCount > 10 ? (
                          <Badge variant="default" className="bg-green-500">High Activity</Badge>
                        ) : chatbot.metadata.conversationCount > 5 ? (
                          <Badge variant="secondary" className="bg-yellow-500">Moderate</Badge>
                        ) : (
                          <Badge variant="outline">Getting Started</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Coins className="h-4 w-4 mr-2" />
            Buy CHAT Tokens
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Trophy className="h-4 w-4 mr-2" />
            Browse NFT Marketplace
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Wallet className="h-4 w-4 mr-2" />
            View Transaction History
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
