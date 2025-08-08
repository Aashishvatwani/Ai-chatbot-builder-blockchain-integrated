'use client';

import { useState } from 'react';
import { useWeb3 } from './Web3Provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Coins, Trophy, Zap } from 'lucide-react';

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshBalance(), refreshChatbots()]);
    setIsRefreshing(false);
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
            Connect your wallet to access blockchain features
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
        </CardContent>
      </Card>

      {/* NFT Chatbots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your NFT Chatbots ({userChatbots.length})
          </CardTitle>
          <CardDescription>
            Chatbots you own as NFTs on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userChatbots.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No NFT chatbots found. Create and mint your first chatbot!
            </p>
          ) : (
            <div className="grid gap-4">
              {userChatbots.map((chatbot) => (
                <div key={chatbot.tokenId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{String(chatbot.name || 'Unknown')}</h3>
                    <Badge variant="outline">#{chatbot.tokenId}</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Conversations:</span>
                      <span>{String(chatbot.conversationCount || '0')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Earnings:</span>
                      <span className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {parseFloat(String(chatbot.totalEarnings || '0')).toFixed(2)} CHAT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>
                        {chatbot.createdAt ? new Date(Number(chatbot.createdAt) * 1000).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Characteristics:</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(chatbot.characteristics) ? (
                        <>
                          {(chatbot.characteristics as string[]).slice(0, 3).map((char: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {char.length > 20 ? `${char.slice(0, 20)}...` : char}
                            </Badge>
                          ))}
                          {(chatbot.characteristics as string[]).length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(chatbot.characteristics as string[]).length - 3} more
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">No characteristics</span>
                      )}
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
