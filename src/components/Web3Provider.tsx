'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { web3Service, ChatbotData } from '@/lib/web3Service';
import { toast } from 'sonner';

interface Web3ContextType {
  isConnected: boolean;
  account: string | null;
  tokenBalance: string;
  userChatbots: ChatbotData[];
  connectWallet: () => Promise<void>;
  mintChatbotNFT: (name: string, characteristics: string[], offChainId: number) => Promise<{ 
    tokenId: string; 
    metadataUrl: string; 
    ipfsHashes: { metadataHash: string; imageHash: string } 
  }>;
  processMessagePayment: (chatbotId: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  refreshChatbots: () => Promise<void>;
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
  const [userChatbots, setUserChatbots] = useState<ChatbotData[]>([]);

  const refreshBalance = useCallback(async () => {
    if (account) {
      try {
        const balance = await web3Service.getTokenBalance(account);
        setTokenBalance(balance);
      } catch (error) {
        console.error('Error fetching balance:', error);
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
      const connectedAccount = await web3Service.connectWallet();
      setAccount(connectedAccount);
      setIsConnected(true);
      await refreshBalance();
      await refreshChatbots();
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
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

  const processMessagePayment = async (chatbotId: number): Promise<boolean> => {
    try {
      const success = await web3Service.processMessagePayment(chatbotId);
      await refreshBalance();
      return success;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
      return false;
    }
  };

  const value: Web3ContextType = {
    isConnected,
    account,
    tokenBalance,
    userChatbots,
    connectWallet,
    mintChatbotNFT,
    processMessagePayment,
    refreshBalance,
    refreshChatbots,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
