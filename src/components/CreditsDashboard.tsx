'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from './Web3Provider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from '@/components/ui/progress';
import { Coins, Trophy, Users, TrendingUp, Gift, DollarSign, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { getEarningsStats } from '@/lib/earningsTracker';

export default function CreditsDashboard() {
  const { isConnected, account, tokenBalance, mintDemoTokens, refreshBalance } = useWeb3();
  const [claiming, setClaiming] = useState(false);
  const [earnings, setEarnings] = useState(getEarningsStats());

  const balance = parseFloat(tokenBalance) || 0;
  const totalEarned = balance; // In a real app, track total earned separately
  const messagesAffordable = Math.floor(balance / 0.001);

  // Update earnings data when component mounts or when there might be new purchases
  useEffect(() => {
    const updateEarnings = () => {
      setEarnings(getEarningsStats());
    };

    updateEarnings();
    
    // Listen for purchase events (custom event)
    const handlePurchase = () => updateEarnings();
    window.addEventListener('chatTokenPurchase', handlePurchase);
    
    return () => {
      window.removeEventListener('chatTokenPurchase', handlePurchase);
    };
  }, []);
  
  // Calculate user level based on balance
  const getUserLevel = (balance: number) => {
    if (balance >= 1) return { level: 'Gold', color: 'bg-yellow-500', next: 10, current: balance };
    if (balance >= 0.1) return { level: 'Silver', color: 'bg-gray-400', next: 1, current: balance };
    if (balance >= 0.01) return { level: 'Bronze', color: 'bg-orange-600', next: 0.1, current: balance };
    return { level: 'Starter', color: 'bg-green-600', next: 0.01, current: balance };
  };

  const userLevel = getUserLevel(balance);
  const progressToNext = (userLevel.current / userLevel.next) * 100;

  const handleDailyClaim = async () => {
    setClaiming(true);
    try {
      const success = await mintDemoTokens(0.01);
      if (success) {
        toast.success("🎉 Daily credits claimed! Come back tomorrow for more!");
        await refreshBalance();
      }
    } catch (error) {
      toast.error("Failed to claim daily credits. Try again tomorrow!");
    } finally {
      setClaiming(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-yellow-500" />
          CHAT Credits Dashboard
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-blue-600">
            {balance.toFixed(4)}
          </div>
          <div className="text-sm text-gray-600">CHAT Credits</div>
          <Badge variant="outline" className="text-xs">
            {messagesAffordable} messages available
          </Badge>
        </div>

        {/* Platform Earnings Section */}
        <div className="bg-green-50 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium text-sm">Platform Earnings</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {earnings.totalEthEarned.toFixed(4)}
              </div>
              <div className="text-xs text-green-700">Total ETH Earned</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                ${earnings.totalUsdEarned.toFixed(2)}
              </div>
              <div className="text-xs text-green-700">USD Value</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2 rounded">
              <div className="text-sm font-medium text-green-600">
                {earnings.dailyEarnings.toFixed(3)}
              </div>
              <div className="text-xs text-gray-600">Today ETH</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-sm font-medium text-green-600">
                {earnings.weeklyEarnings.toFixed(3)}
              </div>
              <div className="text-xs text-gray-600">Week ETH</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-sm font-medium text-green-600">
                {earnings.totalTransactions}
              </div>
              <div className="text-xs text-gray-600">Purchases</div>
            </div>
          </div>
        </div>

        {/* User Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Level</span>
            <Badge className={`${userLevel.color} text-white`}>
              <Trophy className="h-3 w-3 mr-1" />
              {userLevel.level}
            </Badge>
          </div>
          {userLevel.level !== 'Gold' && (
            <div className="space-y-1">
              <Progress value={progressToNext} className="h-2" />
              <div className="text-xs text-gray-500 text-center">
                {(userLevel.next - userLevel.current).toFixed(4)} credits to {
                  userLevel.level === 'Starter' ? 'Bronze' :
                  userLevel.level === 'Bronze' ? 'Silver' : 'Gold'
                }
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <div className="text-sm font-medium">{earnings.totalChatPurchased.toLocaleString()}</div>
            <div className="text-xs text-gray-600">CHAT Sold</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-purple-600" />
            <div className="text-sm font-medium">{earnings.averageTransactionSize.toFixed(4)}</div>
            <div className="text-xs text-gray-600">Avg ETH/Purchase</div>
          </div>
        </div>

        {/* Daily Claim */}
        <div className="space-y-2">
          <Button 
            onClick={handleDailyClaim}
            disabled={claiming}
            className="w-full"
            variant="outline"
          >
            <Gift className="h-4 w-4 mr-2" />
            {claiming ? "Claiming..." : "🎁 Daily Credit Bonus"}
          </Button>
          <div className="text-xs text-center text-gray-500">
            Claim 0.01 CHAT credits daily! Build your balance through engagement.
          </div>
        </div>

        {/* Earning Tips */}
        <div className="bg-yellow-50 p-3 rounded-lg space-y-1">
          <div className="text-sm font-medium text-yellow-800">💡 Earn More Credits:</div>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>• Chat daily for bonus credits</div>
            <div>• Engage with premium bots</div>
            <div>• Buy CHAT tokens with ETH</div>
            <div>• Create your own chatbot NFT</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
