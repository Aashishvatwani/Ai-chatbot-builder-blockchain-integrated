'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/components/Web3Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Wallet, 
  Coins, 
  MessageCircle, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  Info
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chatbotName: string;
  isNFTBot: boolean;
  userBalance: string;
  messageCost: number;
  creatorAddress?: string;
  isProcessing: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  chatbotName,
  isNFTBot,
  userBalance,
  messageCost,
  creatorAddress,
  isProcessing
}: PaymentModalProps) {
  const { isConnected, account, connectWallet } = useWeb3();
  const [hasEnoughBalance, setHasEnoughBalance] = useState(false);

  useEffect(() => {
    const balance = parseFloat(userBalance);
    setHasEnoughBalance(balance >= messageCost);
  }, [userBalance, messageCost]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isNFTBot) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Free Chat Available
            </DialogTitle>
            <DialogDescription>
              This is a regular chatbot - no payment required!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You can chat with <strong>{chatbotName}</strong> for free. No wallet connection required.
              </AlertDescription>
            </Alert>
            <Button onClick={onConfirm} className="w-full">
              Start Free Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-600" />
            NFT Chatbot Payment Required
          </DialogTitle>
          <DialogDescription>
            This is a premium NFT chatbot that requires CHAT tokens for each message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chatbot Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{chatbotName}</CardTitle>
              <CardDescription>Premium AI Chatbot NFT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Message Cost:</span>
                <Badge variant="default" className="text-sm">
                  {messageCost} CHAT
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Creator Earns:</span>
                <Badge variant="secondary" className="text-sm">
                  {messageCost * 0.8} CHAT (80%)
                </Badge>
              </div>
              {creatorAddress && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Creator:</span>
                  <Badge variant="outline" className="text-xs">
                    {formatAddress(creatorAddress)}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Connection */}
          {!isConnected ? (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <Wallet className="h-12 w-12 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900">Wallet Required</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Connect your wallet to pay with CHAT tokens
                    </p>
                  </div>
                  <Button onClick={connectWallet} className="w-full">
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Wallet Connected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Your Address:</span>
                  <Badge variant="outline" className="text-xs">
                    {formatAddress(account!)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CHAT Balance:</span>
                  <Badge 
                    variant={hasEnoughBalance ? "default" : "destructive"}
                    className="text-sm"
                  >
                    {parseFloat(userBalance).toFixed(2)} CHAT
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Balance Warning */}
          {isConnected && !hasEnoughBalance && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Insufficient Balance!</strong> You need at least {messageCost} CHAT tokens to send a message.
                <div className="mt-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Buy CHAT Tokens
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Info */}
          {isConnected && hasEnoughBalance && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Ready to send!</strong> Each message will cost {messageCost} CHAT tokens.
                The creator will receive {messageCost * 0.8} CHAT (80% revenue share).
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              className="flex-1"
              disabled={!isConnected || !hasEnoughBalance || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message ({messageCost} CHAT)
                </>
              )}
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>🔒 Payments are processed automatically via smart contract</p>
            <p>⚡ Gas fees apply for Ethereum transactions</p>
            <p>💰 Support creators by using their NFT chatbots!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
