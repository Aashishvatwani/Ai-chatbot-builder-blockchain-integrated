import { ethers } from 'ethers';
import ChatbotNFTABI from '../../contracts/abis/ChatbotNFT.json';
import ChatTokenABI from '../../contracts/abis/ChatToken.json';
import { ipfsService, NFTMetadata } from './ipfsService';

interface MintEvent {
  event: string;
  args?: {
    tokenId: { toString(): string };
  };
}

interface TransactionReceipt {
  events?: MintEvent[];
}

export interface ChatbotData {
  tokenId: string;
  name: string;
  characteristics: string[];
  conversationCount: string;
  createdAt: string;
  creator: string;
  totalEarnings: string;
}

// Contract addresses (replace with your deployed addresses)
const CHATBOT_NFT_ADDRESS = process.env.NEXT_PUBLIC_CHATBOT_NFT_ADDRESS;
const CHAT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CHAT_TOKEN_ADDRESS;

export class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private chatbotNFTContract: ethers.Contract | null = null;
  private chatTokenContract: ethers.Contract | null = null;

  async initialize() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      
      this.chatbotNFTContract = new ethers.Contract(
        CHATBOT_NFT_ADDRESS!,
        ChatbotNFTABI,
        this.signer
      );
      
      this.chatTokenContract = new ethers.Contract(
        CHAT_TOKEN_ADDRESS!,
        ChatTokenABI,
        this.signer
      );
    }
  }

  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    }) as string[];

    await this.initialize();
    return accounts[0];
  }

  async mintChatbotNFT(
    name: string,
    characteristics: string[],
    offChainId: number
  ): Promise<{ tokenId: string; metadataUrl: string; ipfsHashes: { metadataHash: string; imageHash: string } }> {
    if (!this.chatbotNFTContract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Wallet not connected');

    const userAddress = await this.signer.getAddress();

    // Step 1: Upload metadata to IPFS via Pinata
    console.log('Uploading NFT metadata to IPFS...');
    const ipfsResult = await ipfsService.uploadNFTMetadata(
      offChainId,
      name,
      characteristics,
      userAddress
    );

    // Step 2: Mint NFT with IPFS metadata URL
    console.log('Minting NFT on blockchain...');
    const tx = await this.chatbotNFTContract.mintChatbot(
      userAddress,
      name,
      characteristics,
      ipfsResult.metadataUrl, // Use IPFS URL as tokenURI
      offChainId
    );

    const receipt = await tx.wait() as TransactionReceipt;
    const event = receipt.events?.find((e: MintEvent) => e.event === 'ChatbotMinted');
    
    if (!event || !event.args?.tokenId) {
      throw new Error('NFT minting failed - no event emitted or invalid token ID');
    }

    const tokenId = event.args.tokenId.toString();
    
    console.log(`NFT minted successfully! Token ID: ${tokenId}`);

    return {
      tokenId,
      metadataUrl: ipfsResult.metadataUrl,
      ipfsHashes: {
        metadataHash: ipfsResult.metadataHash,
        imageHash: ipfsResult.imageHash
      }
    };
  }

  async getUserChatbots(userAddress: string): Promise<ChatbotData[]> {
    if (!this.chatbotNFTContract) throw new Error('Contract not initialized');

    try {
      console.log('Fetching user chatbots for address:', userAddress);
      
      // Check if the contract has the getUserChatbots function
      const tokenIds = await this.chatbotNFTContract.getUserChatbots(userAddress);
      console.log('Found token IDs:', tokenIds.map((id: ethers.BigNumber) => id.toString()));
      
      if (tokenIds.length === 0) {
        console.log('No NFTs found for user');
        return [];
      }
      
      const chatbots = await Promise.all(
        tokenIds.map(async (tokenId: ethers.BigNumber) => {
          try {
            console.log(`Fetching metadata for token ID: ${tokenId.toString()}`);
            const metadata = await this.chatbotNFTContract!.getChatbotMetadata(tokenId);
            console.log(`Metadata for token ${tokenId.toString()}:`, metadata);
            
            // Parse the metadata properly - it comes as a tuple from Solidity
            const [name, characteristics, conversationCount, createdAt, creator, totalEarnings] = metadata;
            
            return {
              tokenId: tokenId.toString(),
              name: name,
              characteristics: characteristics,
              conversationCount: conversationCount.toString(),
              createdAt: createdAt.toString(),
              creator: creator,
              totalEarnings: totalEarnings.toString()
            };
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId.toString()}:`, error);
            // Return basic info if metadata fetch fails
            return {
              tokenId: tokenId.toString(),
              name: 'Unknown',
              characteristics: [],
              conversationCount: '0',
              createdAt: '0',
              creator: userAddress,
              totalEarnings: '0'
            };
          }
        })
      );

      console.log('Processed chatbots data:', chatbots);
      return chatbots;
    } catch (error) {
      console.error('Error fetching user chatbots:', error);
      
      // Check if the error is because the function doesn't exist
      if (error instanceof Error && error.message.includes('getUserChatbots')) {
        console.log('getUserChatbots function not found in contract - user likely has no NFTs yet');
        return [];
      }
      
      // For any other error, return empty array but log it
      console.log('Returning empty array due to error, user may not have any NFTs');
      return [];
    }
  }

  async getTokenBalance(userAddress: string): Promise<string> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');

    try {
      const balance = await this.chatTokenContract.balanceOf(userAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  }

  async getETHBalance(userAddress: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');

    try {
      const balance = await this.provider.getBalance(userAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      return '0';
    }
  }

  async getMessageCostInETH(): Promise<{ chatCost: string; ethCost: string; gasEstimate: string }> {
    if (!this.chatTokenContract || !this.provider) throw new Error('Contract not initialized');

    try {
      // Get CHAT token cost
      const chatCost = await this.chatTokenContract.getMessageCost();
      const chatCostFormatted = ethers.utils.formatEther(chatCost);

      // Estimate gas cost for the transaction
      const gasPrice = await this.provider.getGasPrice();
      const gasLimit = ethers.BigNumber.from(21000); // Standard transfer gas limit
      const gasCost = gasPrice.mul(gasLimit);
      const gasCostFormatted = ethers.utils.formatEther(gasCost);

      return {
        chatCost: chatCostFormatted,
        ethCost: gasCostFormatted,
        gasEstimate: gasLimit.toString()
      };
    } catch (error) {
      console.error('Error calculating costs:', error);
      return {
        chatCost: '0.001',
        ethCost: '0.0001',
        gasEstimate: '21000'
      };
    }
  }

  // Helper function to mint demo tokens for testing
  async mintDemoTokens(userAddress: string, amount: number = 100): Promise<boolean> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');
    
    try {
      const amountWei = ethers.utils.parseEther(amount.toString());
      const tx = await this.chatTokenContract.mintRewards(userAddress, amountWei);
      await tx.wait();
      console.log(`Minted ${amount} demo CHAT tokens to ${userAddress}`);
      return true;
    } catch (error) {
      console.error('Error minting demo tokens:', error);
      return false;
    }
  }

  // Debug function to test contract connectivity
  async testContractConnection(): Promise<{ nft: boolean; token: boolean }> {
    const results = { nft: false, token: false };
    
    try {
      if (this.chatbotNFTContract) {
        const name = await this.chatbotNFTContract.name();
        console.log('NFT Contract name:', name);
        results.nft = true;
      }
    } catch (error) {
      console.error('NFT contract test failed:', error);
    }

    try {
      if (this.chatTokenContract) {
        const name = await this.chatTokenContract.name();
        console.log('Token Contract name:', name);
        results.token = true;
      }
    } catch (error) {
      console.error('Token contract test failed:', error);
    }

    return results;
  }

  /**
   * Get NFT token ID from database chatbot ID by checking IPFS metadata
   */
  async getNFTTokenIdFromChatbotId(chatbotId: number, ipfsHash?: string): Promise<string | null> {
    if (!ipfsHash) {
      console.log(`No IPFS hash provided for chatbot ${chatbotId}`);
      return null;
    }

    try {
      // Fetch metadata from IPFS
      const metadata = await ipfsService.getNFTMetadata(ipfsHash);
      
      if (metadata.attributes) {
        // Find the token_id attribute in the metadata
        const tokenIdAttr = metadata.attributes.find(attr => 
          attr.trait_type === 'token_id' || attr.trait_type === 'tokenId'
        );
        
        if (tokenIdAttr) {
          return tokenIdAttr.value.toString();
        }
      }

      // If token_id is stored directly in metadata
      const tokenIdValue = (metadata as { token_id?: string }).token_id;
      if (tokenIdValue !== undefined && tokenIdValue !== null) {
        return tokenIdValue.toString();
      }

      

      // Alternative approach: search through user's NFTs to find one with matching chatbot_id
      if (this.chatbotNFTContract && this.signer) {
        const userAddress = await this.signer.getAddress();
        const userChatbots = await this.getUserChatbots(userAddress);
        
        for (const chatbot of userChatbots) {
          try {
            const tokenURI = await this.chatbotNFTContract.tokenURI(chatbot.tokenId);
            const tokenMetadata = await ipfsService.getNFTMetadata(
              tokenURI.replace('https://gateway.pinata.cloud/ipfs/', '')
            );
            
            if (tokenMetadata.chatbot_id === chatbotId) {
              return chatbot.tokenId;
            }
          } catch (error) {
            console.log(`Error checking token ${chatbot.tokenId}:`, error);
            continue;
          }
        }
      }

      console.log(`No token ID found in IPFS metadata for chatbot ${chatbotId}`);
      return null;
    } catch (error) {
      console.error(`Error fetching token ID from IPFS for chatbot ${chatbotId}:`, error);
      return null;
    }
  }

  async processMessagePayment(chatbotId: number, ipfsHash?: string, chatSessionId?: number): Promise<boolean> {
    // EMERGENCY BYPASS: Complete disable of processMessage to prevent gas estimation errors
    console.error('🚨 EMERGENCY BYPASS ACTIVATED - processMessage() completely disabled');
    console.log('🔧 Force-redirecting to directTokenTransfer ONLY');
    
    if (!this.chatTokenContract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Wallet not connected');

    try {
      const userAddress = await this.signer.getAddress();
      
      console.log(`🔧 EMERGENCY VERSION 3.0: Processing payment for chatbot ${chatbotId} using direct transfer method ONLY`);
      console.log(`📋 User: ${userAddress}`);
      console.log(`📋 Chatbot ID type: ${typeof chatbotId}`);
      console.log(`📋 Chatbot ID value: ${chatbotId}`);
      console.log(`📋 Chatbot ID toString: ${chatbotId.toString()}`);
      console.log(`🚨 This version EMERGENCY BYPASSES processMessage() to avoid the gas estimation error`);
      
      // EMERGENCY: Force use of direct transfer method to avoid the processMessage issues
      // This completely bypasses the problematic processMessage function
      return await this.directTokenTransfer(userAddress);
      
    } catch (error) {
      console.error('🚨 Payment processing failed:', error);
      return false;
    }
  }

  async recordConversation(tokenId: string, reward: number): Promise<void> {
    if (!this.chatbotNFTContract) throw new Error('Contract not initialized');

    const tx = await this.chatbotNFTContract.recordConversation(
      tokenId,
      ethers.utils.parseEther(reward.toString())
    );

    await tx.wait();
  }

  async registerChatbotInContract(chatbotId: number, creatorAddress: string): Promise<void> {
    // Note: This function requires owner permissions in the current contract setup
    // For testing, you'll need to run the register-chatbots.js script
    // or modify the contract to allow public registration
    throw new Error('Chatbot registration requires contract owner permissions. Please run the register-chatbots.js script.');
  }

  async directTokenTransfer(userAddress: string): Promise<boolean> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');

    try {
      // Use a fixed smaller amount (0.001 CHAT) for direct transfer
      // This is a fallback when the proper processMessage flow can't be used
      const messageCostWei = ethers.utils.parseEther('0.001'); // 0.001 CHAT tokens
      
      console.log(`💰 DIRECT TRANSFER: Exact amount being transferred: ${ethers.utils.formatEther(messageCostWei)} CHAT`);
      console.log(`💰 DIRECT TRANSFER: Amount in Wei: ${messageCostWei.toString()}`);
      console.log(`💰 DIRECT TRANSFER: User address: ${userAddress}`);
      
      // Check if user has enough balance
      const balance = await this.chatTokenContract.balanceOf(userAddress);
      console.log(`💰 DIRECT TRANSFER: User balance: ${ethers.utils.formatEther(balance)} CHAT`);
      
      if (balance.lt(messageCostWei)) {
        console.error(`❌ INSUFFICIENT BALANCE: User has ${ethers.utils.formatEther(balance)} CHAT but needs ${ethers.utils.formatEther(messageCostWei)} CHAT`);
        throw new Error(`Insufficient CHAT credits! You have ${ethers.utils.formatEther(balance)} CHAT but need ${ethers.utils.formatEther(messageCostWei)} CHAT. Please claim daily credits first!`);
      }

      // Get platform address (contract owner)
      const platformAddress = await this.chatTokenContract.owner();
      console.log(`💰 DIRECT TRANSFER: Platform address: ${platformAddress}`);
      console.log(`💰 DIRECT TRANSFER: This will transfer FROM user (${userAddress}) TO platform (${platformAddress})`);
      
      // Transfer tokens directly to platform using fixed cost
      console.log(`🚀 DIRECT TRANSFER: About to transfer ${ethers.utils.formatEther(messageCostWei)} CHAT from user to platform`);
      const tx = await this.chatTokenContract.transfer(platformAddress, messageCostWei);
      await tx.wait();
      
      console.log(`✅ DIRECT TRANSFER: Payment of 0.001 CHAT transferred from user to platform (direct transfer)`);
      console.log(`📄 DIRECT TRANSFER: Transaction hash: ${tx.hash}`);
      return true;
    } catch (error) {
      console.error('Direct token transfer failed:', error);
      throw error;
    }
  }

  private async getTokenURI(tokenId: string): Promise<string> {
    if (!this.chatbotNFTContract) throw new Error('Contract not initialized');
    return await this.chatbotNFTContract.tokenURI(tokenId);
  }

  async getNFTMetadataFromIPFS(tokenId: string): Promise<NFTMetadata> {
    try {
      const tokenURI = await this.getTokenURI(tokenId);
      
      // Extract IPFS hash from tokenURI
      const ipfsHash = tokenURI.replace('https://gateway.pinata.cloud/ipfs/', '');
      
      // Fetch metadata from IPFS
      return await ipfsService.getNFTMetadata(ipfsHash);
    } catch (error) {
      console.error('Error fetching NFT metadata from IPFS:', error);
      throw error;
    }
  }

  // Event listeners
  onChatbotMinted(callback: (tokenId: string, creator: string, name: string) => void) {
    if (!this.chatbotNFTContract) return;

    this.chatbotNFTContract.on('ChatbotMinted', (tokenId, creator, name) => {
      callback(tokenId.toString(), creator, name);
    });
  }

  // New daily system functions
  async getUserDailyStatus(userAddress: string): Promise<{
    freeMessagesRemaining: number;
    canClaimDaily: boolean;
    dailyClaimsRemaining: number;
  }> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');
    
    try {
      const status = await this.chatTokenContract.getUserDailyStatus(userAddress);
      return {
        freeMessagesRemaining: status.freeMessagesRemaining.toNumber(),
        canClaimDaily: status.canClaimDaily,
        dailyClaimsRemaining: status.dailyClaimsRemaining.toNumber()
      };
    } catch (error) {
      console.error('Error getting daily status:', error);
      return {
        freeMessagesRemaining: 0,
        canClaimDaily: false,
        dailyClaimsRemaining: 0
      };
    }
  }

  async claimDailyReward(): Promise<boolean> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');
    
    try {
      const tx = await this.chatTokenContract.claimDailyReward();
      await tx.wait();
      console.log('✅ Daily reward claimed successfully!');
      return true;
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      return false;
    }
  }

  async buyChatTokens(ethAmount: string): Promise<boolean> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');
    
    try {
      const ethAmountWei = ethers.utils.parseEther(ethAmount);
      const tx = await this.chatTokenContract.buyChatTokens({ value: ethAmountWei });
      await tx.wait();
      console.log(`✅ Successfully bought CHAT tokens with ${ethAmount} ETH`);
      return true;
    } catch (error) {
      console.error('Error buying CHAT tokens:', error);
      return false;
    }
  }

  async getChatTokenQuote(ethAmount: string): Promise<string> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');
    
    try {
      const ethAmountWei = ethers.utils.parseEther(ethAmount);
      const chatTokens = await this.chatTokenContract.getChatTokenQuote(ethAmountWei);
      return ethers.utils.formatEther(chatTokens);
    } catch (error) {
      console.error('Error getting quote:', error);
      return '0';
    }
  }

  // ETH earnings methods (for improved contract)
  async claimEthEarnings(): Promise<boolean> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');
    
    try {
      const tx = await this.chatTokenContract.claimEthEarnings();
      await tx.wait();
      console.log('✅ Successfully claimed ETH earnings');
      return true;
    } catch (error) {
      console.error('Error claiming ETH earnings:', error);
      return false;
    }
  }

  async getCreatorStats(creatorAddress: string): Promise<{
    messageCount: number;
    chatEarnings: string;
    ethEarnings: string;
    pendingEthEarnings: string;
  }> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');
    
    try {
      const stats = await this.chatTokenContract.getCreatorStats(creatorAddress);
      return {
        messageCount: stats.messageCount.toNumber(),
        chatEarnings: ethers.utils.formatEther(stats.chatEarnings),
        ethEarnings: ethers.utils.formatEther(stats.ethEarnings),
        pendingEthEarnings: ethers.utils.formatEther(stats.pendingEthEarnings)
      };
    } catch (error) {
      console.error('Error getting creator stats:', error);
      return {
        messageCount: 0,
        chatEarnings: '0',
        ethEarnings: '0',
        pendingEthEarnings: '0'
      };
    }
  }

  async getPlatformStats(): Promise<{
    totalEthReceived: string;
    ethInCreatorPool: string;
    contractEthBalance: string;
  }> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');
    
    try {
      const stats = await this.chatTokenContract.getPlatformStats();
      return {
        totalEthReceived: ethers.utils.formatEther(stats.totalEthReceived),
        ethInCreatorPool: ethers.utils.formatEther(stats.ethInCreatorPool),
        contractEthBalance: ethers.utils.formatEther(stats.contractEthBalance)
      };
    } catch (error) {
      console.error('Error getting platform stats:', error);
      return {
        totalEthReceived: '0',
        ethInCreatorPool: '0',
        contractEthBalance: '0'
      };
    }
  }

  onTokensEarned(callback: (creator: string, chatbotId: string, amount: string) => void) {
    if (!this.chatTokenContract) return;

    this.chatTokenContract.on('TokensEarned', (creator, chatbotId, amount) => {
      callback(creator, chatbotId.toString(), ethers.utils.formatEther(amount));
    });
  }
}

export const web3Service = new Web3Service();