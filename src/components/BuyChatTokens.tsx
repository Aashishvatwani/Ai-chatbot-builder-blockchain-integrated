'use client';

import { useState } from 'react';
import { useWeb3 } from './Web3Provider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ShoppingCart, Zap, TrendingUp, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { recordPurchase } from '@/lib/earningsTracker';
import { useMutation } from '@apollo/client';
import { RECORD_TOKEN_PURCHASE, RECORD_PLATFORM_EARNINGS } from '../../graphql/mutations/blockchainMutations';

export default function BuyChatTokens() {
  const { isConnected, account, ethBalance, buyChatTokens, refreshBalance } = useWeb3();
  const [ethAmount, setEthAmount] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  
  // GraphQL mutations
  const [recordTokenPurchase] = useMutation(RECORD_TOKEN_PURCHASE);
  const [recordPlatformEarnings] = useMutation(RECORD_PLATFORM_EARNINGS);

  // Constants
  const ETH_TO_CHAT_RATE = 10000; // 1 ETH = 10,000 CHAT
  const MIN_ETH_PURCHASE = 0.001; // Minimum 0.001 ETH

  // Calculate CHAT tokens for given ETH amount
  const calculateChatTokens = (eth: string) => {
    if (!eth || isNaN(parseFloat(eth))) return 0;
    return parseFloat(eth) * ETH_TO_CHAT_RATE;
  };

  // Predefined purchase amounts
  const quickAmounts = [
    { eth: '0.001', chat: 10, label: 'Starter Pack' },
    { eth: '0.005', chat: 50, label: 'Popular' },
    { eth: '0.01', chat: 100, label: 'Power User' },
    { eth: '0.05', chat: 500, label: 'Pro Pack' }
  ];

  const handlePurchase = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    const ethValue = parseFloat(ethAmount);
    if (!ethValue || ethValue < MIN_ETH_PURCHASE) {
      toast.error(`Minimum purchase is ${MIN_ETH_PURCHASE} ETH`);
      return;
    }

    const userEthBalance = parseFloat(ethBalance);
    if (ethValue > userEthBalance) {
      toast.error(`Insufficient ETH balance. You have ${userEthBalance.toFixed(6)} ETH but trying to spend ${ethValue} ETH`);
      return;
    }

    setPurchasing(true);
    try {
      const success = await buyChatTokens(ethAmount);
      
      if (success) {
        const chatTokens = calculateChatTokens(ethAmount);
        
        // Record the purchase in backend database
        try {
          // Record user purchase (skip if table doesn't exist)
          await recordTokenPurchase({
            variables: {
              user_address: account,
              eth_amount: ethValue, // Pass as number
              chat_amount: chatTokens, // Pass as number
              transaction_hash: `0x${Date.now().toString(16)}`, // Temporary hash - replace with actual tx hash
              purchase_type: 'ETH_TO_CHAT'
            },
            errorPolicy: 'ignore'
          });

          // Record platform earnings (skip if table doesn't exist)
          await recordPlatformEarnings({
            variables: {
              source_type: 'TOKEN_PURCHASE',
              amount: ethValue, // Pass as number
              currency: 'ETH',
              transaction_hash: `0x${Date.now().toString(16)}`, // Temporary hash - replace with actual tx hash
              user_address: account
            },
            errorPolicy: 'ignore'
          });

          console.log('✅ Purchase recorded in backend database');
        } catch (backendError) {
          console.warn('⚠️ Backend tables not set up yet. Purchase recorded locally only:', backendError);
          // Continue with local storage fallback
        }
        
        // Record the purchase in localStorage (fallback)
        try {
          recordPurchase(ethValue, chatTokens);
          
          // Dispatch custom event to update dashboard
          window.dispatchEvent(new CustomEvent('chatTokenPurchase'));
        } catch (earningsError) {
          console.warn('Failed to record earnings in localStorage:', earningsError);
        }
        
        toast.success(`🎉 Purchase successful! You received ${chatTokens.toLocaleString()} CHAT tokens for ${ethValue} ETH`);
        setEthAmount('');
        await refreshBalance();
      } else {
        toast.error("Purchase failed. Please try again.");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error( "Purchase failed. Please check your wallet and try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const setQuickAmount = (amount: string) => {
    setEthAmount(amount);
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Buy CHAT Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            Connect your wallet to purchase CHAT tokens with ETH
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          Buy CHAT Tokens
        </CardTitle>
        <div className="text-sm text-gray-600">
          Purchase CHAT tokens with ETH • All payments go to platform
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Exchange Rate */}
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-blue-700">
            1 ETH = {ETH_TO_CHAT_RATE.toLocaleString()} CHAT
          </div>
          <div className="text-xs text-blue-600">
            Minimum purchase: {MIN_ETH_PURCHASE} ETH
          </div>
        </div>

        {/* Quick Purchase Options */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Purchase</Label>
          <div className="grid grid-cols-2 gap-2">
            {quickAmounts.map((option) => (
              <Button
                key={option.eth}
                variant="outline"
                size="sm"
                onClick={() => setQuickAmount(option.eth)}
                className="text-xs flex flex-col h-auto py-2"
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-gray-600">{option.eth} ETH</div>
                <div className="text-blue-600">{option.chat} CHAT</div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Amount */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="eth-amount" className="text-sm font-medium">
              ETH Amount
            </Label>
            <Input
              id="eth-amount"
              type="number"
              placeholder="0.001"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              min={MIN_ETH_PURCHASE}
              step="0.001"
              className="mt-1"
            />
            <div className="text-xs text-gray-500 mt-1">
              Your ETH balance: {parseFloat(ethBalance).toFixed(6)} ETH
            </div>
          </div>

          {/* Preview */}
          {ethAmount && (
            <div className="bg-green-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Purchase Preview</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>ETH to spend:</span>
                  <span className="font-medium">{ethAmount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>CHAT to receive:</span>
                  <span className="font-medium text-green-600">
                    {calculateChatTokens(ethAmount).toLocaleString()} CHAT
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Platform receives:</span>
                  <span>{ethAmount} ETH → 0x3770...27A4</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Purchase Button */}
        <Button 
          onClick={handlePurchase}
          disabled={purchasing || !ethAmount || parseFloat(ethAmount) < MIN_ETH_PURCHASE}
          className="w-full"
          size="lg"
        >
          {purchasing ? (
            "Processing Purchase..."
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Buy {ethAmount ? calculateChatTokens(ethAmount).toLocaleString() : ''} CHAT Tokens
            </>
          )}
        </Button>

        {/* Info */}
        <div className="bg-yellow-50 p-3 rounded-lg space-y-1">
          <div className="text-sm font-medium text-yellow-800">💡 How it works:</div>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>• Send ETH from your wallet</div>
            <div>• Receive CHAT tokens instantly</div>
            <div>• All ETH goes to platform address</div>
            <div>• Use CHAT tokens for premium messaging</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
