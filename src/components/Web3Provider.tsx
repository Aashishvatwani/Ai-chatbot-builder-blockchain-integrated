'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { web3Service, ChatbotData } from '@/lib/web3Service';
import { toast } from 'sonner';

interface Web3ContextType {
  isConnected: boolean;
  account: string | null;
  tokenBalance: string;
  ethBalance: string;
  messageCosts: { chatCost: string; ethCost: string; gasEstimate: string };
  userChatbots: ChatbotData[];
  // Daily system
  dailyStatus: { 
    freeMessagesRemaining: number; 
    canClaimDaily: boolean; 
    dailyClaimsRemaining: number; 
  };
  // ETH earnings
  ethEarnings: {
    pendingEth: string;
    totalEthEarned: string;
    messageCount: number;
  };
  connectWallet: () => Promise<void>;
  mintChatbotNFT: (name: string, characteristics: string[], offChainId: number) => Promise<{ 
    tokenId: string; 
    metadataUrl: string; 
    ipfsHashes: { metadataHash: string; imageHash: string } 
  }>;
  processMessagePayment: (chatbotId: number, ipfsHash?: string, chatSessionId?: number) => Promise<boolean>;
  mintDemoTokens: (amount?: number) => Promise<boolean>;
  // Daily functions
  claimDailyReward: () => Promise<boolean>;
  buyChatTokens: (ethAmount: string) => Promise<boolean>;
  getChatTokenQuote: (ethAmount: string) => Promise<string>;
  // ETH earnings functions
  claimEthEarnings: () => Promise<boolean>;
  getCreatorStats: () => Promise<{ messageCount: number; chatEarnings: string; ethEarnings: string; pendingEthEarnings: string; }>;
  refreshBalance: () => Promise<void>;
  refreshChatbots: () => Promise<void>;
  refreshDailyStatus: () => Promise<void>;
  refreshEthEarnings: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider = ({ children }: Web3ProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [ethBalance, setEthBalance] = useState('0');
  const [messageCosts, setMessageCosts] = useState({ 
    chatCost: '0.001', 
    ethCost: '0.0001', 
    gasEstimate: '21000' 
  });
  const [userChatbots, setUserChatbots] = useState<ChatbotData[]>([]);
  // Daily system state
  const [dailyStatus, setDailyStatus] = useState({
    freeMessagesRemaining: 5,
    canClaimDaily: true,
    dailyClaimsRemaining: 1
  });

  // ETH earnings state
  const [ethEarnings, setEthEarnings] = useState({
    pendingEth: '0',
    totalEthEarned: '0',
    messageCount: 0
  });

  const refreshBalance = useCallback(async () => {
    if (account) {
      try {
        console.log('🔄 Refreshing balance for account:', account);
        const tokenBal = await web3Service.getTokenBalance(account);
        const ethBal = await web3Service.getETHBalance(account);
        const costs = await web3Service.getMessageCostInETH();
        
        console.log('✅ Balance refresh successful:', { tokenBal, ethBal, costs });
        setTokenBalance(tokenBal);
        setEthBalance(ethBal);
        setMessageCosts(costs);
      } catch (error) {
        console.error('❌ Error fetching balances:', error);
        // Set default values on error
        setTokenBalance('0');
        setEthBalance('0');
        setMessageCosts({ 
          chatCost: '0.001', 
          ethCost: '0.0001', 
          gasEstimate: '21000' 
        });
      }
    }
  }, [account]);

  const refreshChatbots = useCallback(async () => {
    if (account) {
      try {
        const chatbots = await web3Service.getUserChatbots(account);
        setUserChatbots(chatbots);
      } catch (error) {
        console.error('Error fetching chatbots:', error);
      }
    }
  }, [account]);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            await web3Service.initialize();
            await refreshBalance();
            await refreshChatbots();
            await refreshDailyStatus();
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    const handleAccountsChanged = (args: unknown) => {
      const accounts = args as string[];
      if (accounts.length === 0) {
        setIsConnected(false);
        setAccount(null);
        setTokenBalance('0');
        setUserChatbots([]);
      } else {
        setAccount(accounts[0]);
        refreshBalance();
        refreshChatbots();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    // Check if wallet is already connected
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [refreshBalance, refreshChatbots]);

  const connectWallet = async () => {
    try {
      console.log('🔗 Attempting to connect wallet...');
      const connectedAccount = await web3Service.connectWallet();
      console.log('✅ Wallet connected:', connectedAccount);
      setAccount(connectedAccount);
      setIsConnected(true);
      await refreshBalance();
      await refreshChatbots();
      await refreshDailyStatus();
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      toast.error('Failed to connect wallet: ' + (error as Error).message);
    }
  };

  const mintChatbotNFT = async (
    name: string, 
    characteristics: string[], 
    offChainId: number
  ): Promise<{ 
    tokenId: string; 
    metadataUrl: string; 
    ipfsHashes: { metadataHash: string; imageHash: string } 
  }> => {
    try {
      const result = await web3Service.mintChatbotNFT(name, characteristics, offChainId);
      await refreshChatbots();
      toast.success('Chatbot NFT minted and metadata stored on IPFS!');
      return {
        tokenId: result.tokenId,
        metadataUrl: result.metadataUrl,
        ipfsHashes: result.ipfsHashes
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error('Failed to mint chatbot NFT');
      throw error;
    }
  };

  const processMessagePayment = async (chatbotId: number, ipfsHash?: string, chatSessionId?: number): Promise<boolean> => {
    try {
      const success = await web3Service.processMessagePayment(chatbotId, ipfsHash, chatSessionId);
      await refreshBalance();
      return success;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
      return false;
    }
  };

  const mintDemoTokens = async (amount: number = 100): Promise<boolean> => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      const success = await web3Service.mintDemoTokens(account, amount);
      if (success) {
        await refreshBalance();
        toast.success(`Minted ${amount} demo CHAT tokens!`);
      }
      return success;
    } catch (error) {
      console.error('Error minting demo tokens:', error);
      toast.error('Failed to mint demo tokens');
      return false;
    }
  };

  // New daily system functions
  const claimDailyReward = async (): Promise<boolean> => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      const success = await web3Service.claimDailyReward();
      if (success) {
        await refreshBalance();
        await refreshDailyStatus();
        toast.success('🎉 Daily reward claimed! 10 CHAT tokens added to your balance');
      }
      return success;
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      toast.error('Failed to claim daily reward');
      return false;
    }
  };

  const buyChatTokens = async (ethAmount: string): Promise<boolean> => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      const success = await web3Service.buyChatTokens(ethAmount);
      if (success) {
        await refreshBalance();
        const chatTokens = await getChatTokenQuote(ethAmount);
        toast.success(`🎉 Successfully bought ${chatTokens} CHAT tokens for ${ethAmount} ETH!`);
      }
      return success;
    } catch (error) {
      console.error('Error buying CHAT tokens:', error);
      toast.error('Failed to buy CHAT tokens');
      return false;
    }
  };

  const getChatTokenQuote = async (ethAmount: string): Promise<string> => {
    try {
      return await web3Service.getChatTokenQuote(ethAmount);
    } catch (error) {
      console.error('Error getting quote:', error);
      return '0';
    }
  };

  // ETH earnings functions
  const claimEthEarnings = async (): Promise<boolean> => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      const success = await web3Service.claimEthEarnings();
      if (success) {
        await refreshBalance();
        await refreshEthEarnings();
        toast.success('🎉 ETH earnings claimed successfully!');
      }
      return success;
    } catch (error) {
      console.error('Error claiming ETH earnings:', error);
      toast.error('Failed to claim ETH earnings');
      return false;
    }
  };

  const getCreatorStats = async () => {
    if (!account) {
      return { messageCount: 0, chatEarnings: '0', ethEarnings: '0', pendingEthEarnings: '0' };
    }

    try {
      return await web3Service.getCreatorStats(account);
    } catch (error) {
      console.error('Error getting creator stats:', error);
      return { messageCount: 0, chatEarnings: '0', ethEarnings: '0', pendingEthEarnings: '0' };
    }
  };

  const refreshEthEarnings = useCallback(async () => {
    if (account) {
      try {
        const stats = await getCreatorStats();
        setEthEarnings({
          pendingEth: stats.pendingEthEarnings,
          totalEthEarned: stats.ethEarnings,
          messageCount: stats.messageCount
        });
      } catch (error) {
        console.error('Error refreshing ETH earnings:', error);
      }
    }
  }, [account]);

  const refreshDailyStatus = async () => {
    if (!account) return;
    
    try {
      const status = await web3Service.getUserDailyStatus(account);
      setDailyStatus(status);
    } catch (error) {
      console.error('Error refreshing daily status:', error);
    }
  };

  const value: Web3ContextType = {
    isConnected,
    account,
    tokenBalance,
    ethBalance,
    messageCosts,
    userChatbots,
    dailyStatus,
    ethEarnings,
    connectWallet,
    mintChatbotNFT,
    processMessagePayment,
    mintDemoTokens,
    claimDailyReward,
    buyChatTokens,
    getChatTokenQuote,
    claimEthEarnings,
    getCreatorStats,
    refreshBalance,
    refreshChatbots,
    refreshDailyStatus,
    refreshEthEarnings,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
