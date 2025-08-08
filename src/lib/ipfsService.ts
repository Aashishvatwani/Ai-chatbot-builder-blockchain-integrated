// IPFS Service for NFT metadata storage via Pinata
// Regular chatbots remain in Neon database, only NFT chatbots use IPFS
import axios from 'axios';

export interface NFTMetadata {
  name: string;
  description: string;
  characteristics: string[];
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  created_at: string;
  creator_address: string;
  chatbot_id: number; // Link to database record
}

class IPFSService {
  private pinataApiKey: string;
  private pinataSecretKey: string;
  private pinataBaseUrl = 'https://api.pinata.cloud';

  constructor() {
    this.pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
    this.pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';
    
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('Pinata API keys not found. NFT metadata uploads will fail.');
    }
  }

  /**
   * Upload NFT metadata to IPFS (only called when minting NFT)
   * Regular chatbots stay in database only
   */
  async uploadNFTMetadata(
    chatbotId: number,
    name: string,
    characteristics: string[],
    creatorAddress: string
  ): Promise<{ metadataHash: string; imageHash: string; metadataUrl: string }> {
    try {
      // Step 1: Generate and upload avatar image
      const avatarBlob = await this.generateAvatarBlob(name);
      const imageHash = await this.uploadFile(avatarBlob, `nft-chatbot-${chatbotId}-avatar.png`);
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;

      // Step 2: Create NFT-standard metadata (ERC721 compliant)
      const metadata: NFTMetadata = {
        name: `AI ChatBot: ${name}`,
        description: `${name} - An intelligent conversational AI assistant with ${characteristics.length} unique characteristics. Own, trade, and earn from conversations with this AI chatbot NFT.`,
        characteristics,
        image: imageUrl,
        external_url: `${process.env.NEXT_PUBLIC_BASE_URL}/chatbot/${chatbotId}`,
        attributes: [
          {
            trait_type: "Bot Type",
            value: "AI Assistant"
          },
          {
            trait_type: "Characteristics Count",
            value: characteristics.length
          },
          {
            trait_type: "Creator",
            value: creatorAddress
          },
          {
            trait_type: "Blockchain",
            value: "Ethereum"
          },
          ...characteristics.map((char, index) => ({
            trait_type: `Trait ${index + 1}`,
            value: char.substring(0, 50) // Limit length for NFT marketplaces
          }))
        ],
        created_at: new Date().toISOString(),
        creator_address: creatorAddress,
        chatbot_id: chatbotId
      };

      // Step 3: Upload metadata JSON to IPFS
      const metadataHash = await this.uploadJSON(
        metadata as unknown as Record<string, unknown>,
        `nft-chatbot-${chatbotId}-metadata.json`
      );

      const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;

      console.log(`NFT metadata uploaded: ${metadataUrl}`);
      
      return { metadataHash, imageHash, metadataUrl };
    } catch (error) {
      console.error('Error uploading NFT metadata to IPFS:', error);
      throw new Error('Failed to upload NFT metadata to IPFS');
    }
  }

  /**
   * Upload a file to IPFS via Pinata
   */
  private async uploadFile(file: Blob, fileName: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file, fileName);
    
    const pinataMetadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        type: 'chatbot-asset',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await axios.post(
      `${this.pinataBaseUrl}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        }
      }
    );

    return response.data.IpfsHash;
  }

  /**
   * Upload JSON metadata to IPFS via Pinata
   */
  private async uploadJSON(metadata: Record<string, unknown>, fileName: string): Promise<string> {
    const response = await axios.post(
      `${this.pinataBaseUrl}/pinning/pinJSONToIPFS`,
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        data: {
          pinataMetadata: {
            name: fileName,
            keyvalues: {
              type: 'chatbot-metadata',
              timestamp: Date.now().toString()
            }
          }
        }
      }
    );

    return response.data.IpfsHash;
  }

  /**
   * Generate avatar blob from chatbot name
   */
  async generateAvatarBlob(seed: string): Promise<Blob> {
    try {
      // Use DiceBear API to generate avatar
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
      const response = await fetch(avatarUrl);
      
      if (!response.ok) {
        throw new Error('Failed to generate avatar');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating avatar:', error);
      throw error;
    }
  }

  /**
   * Get NFT metadata from IPFS hash
   */
  async getNFTMetadata(ipfsHash: string): Promise<NFTMetadata> {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching NFT metadata from IPFS:', error);
      throw new Error('Failed to fetch NFT metadata from IPFS');
    }
  }

  /**
   * Pin existing content to ensure it stays on IPFS
   */
  async pinByHash(ipfsHash: string, name: string): Promise<void> {
    try {
      await axios.post(
        `${this.pinataBaseUrl}/pinning/pinByHash`,
        {
          hashToPin: ipfsHash,
          pinataMetadata: {
            name,
            keyvalues: {
              pinned_by: 'ai-chatpod',
              timestamp: Date.now().toString()
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        }
      );
    } catch (error) {
      console.error('Error pinning hash:', error);
      throw error;
    }
  }
}

export const ipfsService = new IPFSService();
