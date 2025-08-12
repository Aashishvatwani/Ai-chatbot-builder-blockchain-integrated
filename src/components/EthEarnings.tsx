'use client';

import { useState } from 'react';
import { useWeb3 } from './Web3Provider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { DollarSign, TrendingUp, MessageCircle, Wallet, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function EthEarnings() {
  const { isConnected, account, ethEarnings, claimEthEarnings, refreshEthEarnings } = useWeb3();
  const [claiming, setClaiming] = useState(false);

  const handleClaimEthEarnings = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setClaiming(true);
    try {
      const success = await claimEthEarnings();
      if (success) {
        await refreshEthEarnings();
        toast.success("🎉 ETH earnings claimed successfully!");
      } else {
        toast.error("Failed to claim ETH earnings. Please try again.");
      }
    } catch (error) {
      console.error("Claim error:", error);
      toast.error("Failed to claim ETH earnings.");
    } finally {
      setClaiming(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            ETH Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            Connect your wallet to view your ETH earnings from chatbot activity
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingEthFloat = parseFloat(ethEarnings.pendingEth);
  const totalEthFloat = parseFloat(ethEarnings.totalEthEarned);
  const hasPendingEth = pendingEthFloat > 0;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          ETH Earnings
        </CardTitle>
        <div className="text-sm text-gray-600">
          Earn ETH from token purchases • 30% revenue share
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pending ETH Earnings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pending ETH</span>
            <Badge variant={hasPendingEth ? "default" : "secondary"}>
              {ethEarnings.pendingEth} ETH
            </Badge>
          </div>
          
          {hasPendingEth && (
            <Button 
              onClick={handleClaimEthEarnings}
              disabled={claiming}
              className="w-full"
              size="sm"
            >
              {claiming ? "Claiming..." : `Claim ${ethEarnings.pendingEth} ETH`}
            </Button>
          )}
          
          {!hasPendingEth && (
            <div className="text-xs text-gray-500 text-center py-2">
              No pending ETH earnings yet
            </div>
          )}
        </div>

        <Separator />

        {/* Total Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Total ETH Earned</span>
            </div>
            <span className="font-semibold">{ethEarnings.totalEthEarned} ETH</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Messages Processed</span>
            </div>
            <span className="font-semibold">{ethEarnings.messageCount.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Avg ETH per Message</span>
            </div>
            <span className="font-semibold">
              {ethEarnings.messageCount > 0 
                ? (totalEthFloat / ethEarnings.messageCount).toFixed(6)
                : '0'
              } ETH
            </span>
          </div>
        </div>

        <Separator />

        {/* How It Works */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">💡 How You Earn ETH</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Users buy CHAT tokens with ETH</li>
            <li>• 30% of ETH goes to creator reward pool</li>
            <li>• You earn ETH based on message activity</li>
            <li>• More active chatbots = more ETH earnings</li>
          </ul>
        </div>

        {/* View on Etherscan */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          asChild
        >
          <a 
            href={`https://sepolia.etherscan.io/address/${account}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View on Etherscan
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
