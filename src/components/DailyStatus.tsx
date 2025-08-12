'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from './Web3Provider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Gift, MessageCircle, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DailyStatus() {
  const { 
    isConnected, 
    account, 
    dailyStatus, 
    claimDailyReward, 
    refreshDailyStatus,
    refreshBalance 
  } = useWeb3();
  
  const [claiming, setClaiming] = useState(false);

  // Auto-refresh daily status every 30 seconds
  useEffect(() => {
    if (isConnected && dailyStatus) {
      const interval = setInterval(() => {
        refreshDailyStatus();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, dailyStatus, refreshDailyStatus]);

  const handleClaimDaily = async () => {
    setClaiming(true);
    try {
      const success = await claimDailyReward();
      if (success) {
        toast.success("🎉 Daily reward claimed! You received 10 CHAT tokens!");
        await refreshBalance();
        await refreshDailyStatus();
      }
    } catch (error) {
      console.error("Claim error:", error);
      toast.error( "Failed to claim daily reward. Try again later!");
    } finally {
      setClaiming(false);
    }
  };

  if (!isConnected || !dailyStatus) {
    return null;
  }

  const freeMessagesUsed = 5 - dailyStatus.freeMessagesRemaining;
  const freeMessageProgress = (freeMessagesUsed / 5) * 100;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-green-500" />
          Daily Status
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Free Messages Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Free Messages</span>
            </div>
            <Badge variant={dailyStatus.freeMessagesRemaining > 0 ? "default" : "secondary"}>
              {dailyStatus.freeMessagesRemaining}/5 left
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Progress value={freeMessageProgress} className="h-2" />
            <div className="text-xs text-gray-500 text-center">
              {dailyStatus.freeMessagesRemaining > 0 
                ? `${dailyStatus.freeMessagesRemaining} free messages remaining today`
                : "All free messages used today. Resets at midnight."
              }
            </div>
          </div>
        </div>

        {/* Daily Claim Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Daily Reward</span>
            </div>
            <Badge variant={dailyStatus.canClaimDaily ? "default" : "secondary"}>
              {dailyStatus.canClaimDaily ? "Available" : "Claimed"}
            </Badge>
          </div>

          {dailyStatus.canClaimDaily ? (
            <Button 
              onClick={handleClaimDaily}
              disabled={claiming}
              className="w-full"
              size="sm"
            >
              <Gift className="h-4 w-4 mr-2" />
              {claiming ? "Claiming..." : "🎁 Claim 10 CHAT Tokens"}
            </Button>
          ) : (
            <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-sm text-gray-600">Daily reward claimed! Come back tomorrow.</span>
            </div>
          )}
        </div>

        {/* Next Reset Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-1">⏰ Daily Reset</div>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• Free messages reset at midnight</div>
            <div>• Daily reward resets at midnight</div>
            <div>• All times are in your local timezone</div>
          </div>
        </div>

        {/* Usage Tips */}
        {dailyStatus.freeMessagesRemaining === 0 && (
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-orange-800 mb-1">💡 No more free messages?</div>
            <div className="text-xs text-orange-700 space-y-1">
              <div>• Buy CHAT tokens with ETH to continue</div>
              <div>• Each message costs 10 CHAT tokens</div>
              <div>• Free messages reset tomorrow</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
