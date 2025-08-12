'use client';

import { useState } from 'react';
import { useWeb3 } from './Web3Provider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

export default function Web3Debug() {
  const { 
    isConnected, 
    account, 
    tokenBalance, 
    connectWallet, 
    mintDemoTokens,
    processMessagePayment,
    refreshBalance 
  } = useWeb3();
  
  const [testing, setTesting] = useState(false);

  const testPayment = async () => {
    setTesting(true);
    try {
      // Test payment for a demo chatbot (ID 55)
      const success = await processMessagePayment(55);
      if (success) {
        toast.success("Payment test successful! Tokens were deducted.");
        await refreshBalance();
      } else {
        toast.error("Payment test failed.");
      }
    } catch (error) {
      console.error("Payment test error:", error);
      toast.error("Payment test failed: " + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Web3 Payment Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span>Wallet Status:</span>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        {/* Account Address */}
        {account && (
          <div className="text-sm">
            <span className="font-medium">Account:</span>
            <div className="font-mono text-xs bg-gray-100 p-2 rounded">
              {account}
            </div>
          </div>
        )}

        {/* Token Balance */}
        {isConnected && (
          <div className="flex items-center justify-between">
            <span>CHAT Balance:</span>
            <Badge variant="outline">
              {parseFloat(tokenBalance).toFixed(2)} CHAT
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!isConnected ? (
            <Button onClick={connectWallet} className="w-full">
              Connect Wallet
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => mintDemoTokens(100)} 
                variant="outline" 
                className="w-full"
              >
                Mint 100 Demo Tokens
              </Button>
              
              <Button 
                onClick={testPayment} 
                disabled={testing || parseFloat(tokenBalance) < 10}
                className="w-full"
              >
                {testing ? "Testing Payment..." : "Test Payment (10 CHAT)"}
              </Button>
              
              <Button 
                onClick={refreshBalance} 
                variant="ghost" 
                size="sm" 
                className="w-full"
              >
                Refresh Balance
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>1. Connect your MetaMask wallet</div>
          <div>2. Mint demo tokens if balance is low</div>
          <div>3. Test payment to see tokens deducted</div>
          <div>4. Check MetaMask for transaction history</div>
        </div>
      </CardContent>
    </Card>
  );
}
