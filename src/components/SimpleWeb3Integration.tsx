'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Coins, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface WalletInfo {
  address: string;
  balance: string;
  network: string;
}

export default function SimpleWeb3Integration() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      if (!window.ethereum) {
        toast.error('MetaMask not found. Please install MetaMask to continue.');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        
        // Get balance
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        }) as string;
        
        // Convert wei to ETH
        const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
        
        // Get network
        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        }) as string;
        
        const getNetworkName = (chainId: string) => {
          switch (chainId) {
            case '0x1': return 'Ethereum Mainnet';
            case '0x5': return 'Goerli Testnet';
            case '0x89': return 'Polygon Mainnet';
            case '0x13881': return 'Polygon Mumbai';
            default: return `Chain ID: ${chainId}`;
          }
        };

        setWalletInfo({
          address,
          balance: balanceInEth,
          network: getNetworkName(chainId),
        });
        
        setIsConnected(true);
        toast.success('Wallet connected successfully!');
      }
    } catch (error: unknown) {
      console.error('Error connecting wallet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletInfo(null);
    toast.success('Wallet disconnected');
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
            Web3 Integration
          </CardTitle>
          <CardDescription>
            Connect your wallet to access blockchain features for your AI ChatPods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">🚀 Coming Soon Features:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Mint chatbots as NFTs</li>
              <li>• Earn tokens from conversations</li>
              <li>• Trade chatbots on marketplace</li>
              <li>• Token-based usage system</li>
            </ul>
          </div>
          
          <Button 
            onClick={connectWallet} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Don&apos;t have a wallet?</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://metamask.io/', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Install MetaMask
            </Button>
          </div>
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
              <Wallet className="h-5 w-5 text-green-600" />
              Wallet Connected
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={disconnectWallet}
            >
              Disconnect
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Address:</span>
            <Badge variant="secondary">{formatAddress(walletInfo!.address)}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Network:</span>
            <Badge variant="default">{walletInfo!.network}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">ETH Balance:</span>
            <Badge variant="secondary" className="font-mono">
              {walletInfo!.balance} ETH
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Features Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Blockchain Features (Beta)
          </CardTitle>
          <CardDescription>
            These features are currently in development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg opacity-75">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Token Economy
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Earn CHAT tokens when users interact with your chatbots
            </p>
            <Button disabled variant="outline" size="sm" className="w-full">
              Coming Soon
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg opacity-75">
            <h3 className="font-semibold mb-2">🎨 NFT Chatbots</h3>
            <p className="text-sm text-gray-600 mb-3">
              Turn your chatbots into tradeable NFTs with unique characteristics
            </p>
            <Button disabled variant="outline" size="sm" className="w-full">
              Coming Soon
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg opacity-75">
            <h3 className="font-semibold mb-2">🏪 Marketplace</h3>
            <p className="text-sm text-gray-600 mb-3">
              Buy and sell trained AI chatbots from other creators
            </p>
            <Button disabled variant="outline" size="sm" className="w-full">
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Development Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">🚧 Development Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Smart Contracts:</span>
              <Badge variant="secondary">Ready</Badge>
            </div>
            <div className="flex justify-between">
              <span>Frontend Integration:</span>
              <Badge variant="secondary">In Progress</Badge>
            </div>
            <div className="flex justify-between">
              <span>Token Deployment:</span>
              <Badge variant="outline">Pending</Badge>
            </div>
            <div className="flex justify-between">
              <span>NFT Marketplace:</span>
              <Badge variant="outline">Planned</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
