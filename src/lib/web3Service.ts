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
  name?: unknown;
  conversationCount?: unknown;
  totalEarnings?: unknown;
  [key: string]: unknown;
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

    const tokenIds = await this.chatbotNFTContract.getUserChatbots(userAddress);
    
    const chatbots = await Promise.all(
      tokenIds.map(async (tokenId: ethers.BigNumber) => {
        const metadata = await this.chatbotNFTContract!.getChatbotMetadata(tokenId);
        return {
          tokenId: tokenId.toString(),
          ...metadata
        };
      })
    );

    return chatbots;
  }

  async getTokenBalance(userAddress: string): Promise<string> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');

    const balance = await this.chatTokenContract.balanceOf(userAddress);
    return ethers.utils.formatEther(balance);
  }

  async processMessagePayment(chatbotId: number): Promise<boolean> {
    if (!this.chatTokenContract) throw new Error('Contract not initialized');

    const tx = await this.chatTokenContract.processMessage(
      await this.signer!.getAddress(),
      chatbotId
    );

    await tx.wait();
    return true;
  }

  async recordConversation(tokenId: string, reward: number): Promise<void> {
    if (!this.chatbotNFTContract) throw new Error('Contract not initialized');

    const tx = await this.chatbotNFTContract.recordConversation(
      tokenId,
      ethers.utils.parseEther(reward.toString())
    );

    await tx.wait();
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

  onTokensEarned(callback: (creator: string, chatbotId: string, amount: string) => void) {
    if (!this.chatTokenContract) return;

    this.chatTokenContract.on('TokensEarned', (creator, chatbotId, amount) => {
      callback(creator, chatbotId.toString(), ethers.utils.formatEther(amount));
    });
  }
}

export const web3Service = new Web3Service();
