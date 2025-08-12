'use client';

import { useEffect, useState } from 'react';
import { useWeb3 } from './Web3Provider';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ChevronDown, Info, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PaymentDebuggerProps {
  chatbotId: number;
  className?: string;
}

export default function PaymentDebugger({ chatbotId, className }: PaymentDebuggerProps) {
  const { isConnected, account, tokenBalance } = useWeb3();
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    contractConnected: false,
    chatbotRegistered: false,
    chatbotOwner: '',
    userAuthorized: false,
    contractMessageCost: '',
    userBalance: '',
    canProcessMessage: false,
    recommendedMethod: ''
  });
  const [loading, setLoading] = useState(false);

  const checkPaymentSystem = async () => {
    if (!isConnected || !account) return;
    
    setLoading(true);
    try {
      const info = {
        contractConnected: false,
        chatbotRegistered: false,
        chatbotOwner: '',
        userAuthorized: false,
        contractMessageCost: '',
        userBalance: tokenBalance,
        canProcessMessage: false,
        recommendedMethod: 'Direct transfer - 0.001 CHAT (Safe fallback method)'
      };

      setDebugInfo(info);
    } catch (error) {
      console.error('Payment system check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isConnected && account) {
      checkPaymentSystem();
    }
  }, [isOpen, isConnected, account, chatbotId]);

  const StatusIcon = ({ condition }: { condition: boolean | null }) => {
    if (condition === null) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (!isConnected) {
    return null; // Don't show for non-connected users
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Info className="h-4 w-4 mr-2" />
          Payment System Debug
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
        
        {isOpen && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Payment System Status</CardTitle>
              <Button 
                onClick={checkPaymentSystem} 
                disabled={loading} 
                size="sm" 
                variant="secondary"
              >
                {loading ? 'Checking...' : 'Refresh Status'}
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Contract Connected</span>
                <div className="flex items-center gap-2">
                  <StatusIcon condition={debugInfo.contractConnected} />
                  <Badge variant={debugInfo.contractConnected ? "default" : "destructive"}>
                    {debugInfo.contractConnected ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Current Method</span>
                <Badge variant="secondary">
                  Direct Transfer
                </Badge>
              </div>

              <div className="border-t pt-3">
                <div className="font-medium mb-1">Balance Info:</div>
                <div className="text-xs space-y-1">
                  <div>Your Balance: {debugInfo.userBalance} CHAT</div>
                  <div>Message Cost: 0.001 CHAT</div>
                  <div>Status: {parseFloat(debugInfo.userBalance) >= 0.001 ? '✅ Sufficient' : '❌ Insufficient'}</div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="font-medium mb-1">Recommended Method:</div>
                <div className="text-xs text-gray-600">
                  {debugInfo.recommendedMethod}
                </div>
              </div>

              <div className="border-t pt-3 text-xs text-gray-500">
                <div><strong>Chatbot ID:</strong> {chatbotId}</div>
                <div><strong>User Address:</strong> {account}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
