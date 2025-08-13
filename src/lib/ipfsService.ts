// ipfsService.ts
import axios from 'axios';

export interface NFTMetadata {
  name: string;
  description: string;
  characteristics: string[];
  image: string;
  external_url: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
  created_at: string;
  creator_address: string;
  chatbot_id: number;
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

  /** Upload file (PDF/DOCX) to IPFS */
  async uploadFile(file: Blob, fileName: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file, fileName);

    const pinataMetadata = JSON.stringify({
      name: fileName,
      keyvalues: { type: 'chatbot-asset', timestamp: Date.now().toString() },
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await axios.post(`${this.pinataBaseUrl}/pinning/pinFileToIPFS`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: this.pinataApiKey,
        pinata_secret_api_key: this.pinataSecretKey,
      },
    });

    return response.data.IpfsHash;
  }

  /** Upload JSON metadata to IPFS */
  async uploadJSON(metadata: Record<string, unknown>, fileName: string): Promise<string> {
    const response = await axios.post(
      `${this.pinataBaseUrl}/pinning/pinJSONToIPFS`,
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataSecretKey,
        },
      }
    );

    return response.data.IpfsHash;
  }

  /** Generate avatar blob using DiceBear API */
  async generateAvatarBlob(seed: string): Promise<Blob> {
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    const response = await fetch(avatarUrl);
    if (!response.ok) throw new Error('Failed to generate avatar');
    return await response.blob();
  }

  /** Upload NFT metadata (used when minting NFT) */
  async uploadNFTMetadata(
    chatbotId: number,
    name: string,
    characteristics: string[],
    creatorAddress: string
  ): Promise<{ metadataHash: string; imageHash: string; metadataUrl: string }> {
    const avatarBlob = await this.generateAvatarBlob(name);
    const imageHash = await this.uploadFile(avatarBlob, `nft-chatbot-${chatbotId}-avatar.png`);
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;

    const metadata: NFTMetadata = {
      name: `AI ChatBot: ${name}`,
      description: `${name} - An AI assistant with ${characteristics.length} characteristics. Own, trade, and earn from conversations.`,
      characteristics,
      image: imageUrl,
      external_url: `${process.env.NEXT_PUBLIC_BASE_URL}/chatbot/${chatbotId}`,
      attributes: [
        { trait_type: 'Bot Type', value: 'AI Assistant' },
        { trait_type: 'Characteristics Count', value: characteristics.length },
        { trait_type: 'Creator', value: creatorAddress },
        { trait_type: 'Blockchain', value: 'Ethereum' },
        ...characteristics.map((c, i) => ({ trait_type: `Trait ${i + 1}`, value: c.substring(0, 50) })),
      ],
      created_at: new Date().toISOString(),
      creator_address: creatorAddress,
      chatbot_id: chatbotId,
    };

    const metadataHash = await this.uploadJSON(metadata as unknown as Record<string, unknown>, `nft-chatbot-${chatbotId}-metadata.json`);
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;

    return { metadataHash, imageHash, metadataUrl };
  }

  /** Upload general chatbot metadata (not NFT) */
  async uploadChatbotMetadata(
    chatbotId: number,
    name: string,
    characteristics: string[]
  ): Promise<{ metadataHash: string; metadataUrl: string }> {
    const metadata = {
      name: `AI ChatBot: ${name}`,
      description: `${name} - An intelligent AI assistant with ${characteristics.length} characteristics.`,
      characteristics,
      chatbot_type: 'AI Assistant',
      created_at: new Date().toISOString(),
      chatbot_id: chatbotId,
      attributes: [
        { trait_type: 'Bot Type', value: 'AI Assistant' },
        { trait_type: 'Characteristics Count', value: characteristics.length },
        { trait_type: 'Platform', value: 'AI ChatPod' },
        ...characteristics.map((c, i) => ({ trait_type: `Characteristic ${i + 1}`, value: c.substring(0, 100) })),
      ],
    };

    const metadataHash = await this.uploadJSON(metadata as unknown as Record<string, unknown>, `chatbot-${chatbotId}-metadata.json`);
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;

    return { metadataHash, metadataUrl };
  }
}

export const ipfsService = new IPFSService();
