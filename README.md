# 🤖 AI ChatPod Builder

> **Build, Own, and Monetize AI Chatbots with Blockchain Technology**

A revolutionary platform that combines AI chatbot creation with Web3 technology, allowing users to create intelligent conversational agents, mint them as NFTs, and earn tokens from interactions.

![Next.js](https://img.shields.io/badge/Next.js-15.4.1-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-purple)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)
![Status](https://img.shields.io/badge/Status-Production-green)

## 🌟 Features

### 🎨 **AI Chatbot Creation**
- **Intuitive Builder**: Create AI chatbots with custom personalities and characteristics
- **Smart Avatars**: Automatically generated unique avatars using DiceBear
- **Personality Traits**: Add up to 5 custom characteristics per chatbot
- **Real-time Editing**: Modify chatbot behavior and traits on the fly
- **Guest Interactions**: Allow visitors to chat without registration

### ⛓️ **Blockchain Integration** (Optional)
- **NFT Minting**: Convert chatbots into tradeable NFT assets
- **Token Economy**: CHAT token system for monetizing conversations
- **Smart Contracts**: ERC721 (NFTs) + ERC20 (Tokens) on Ethereum Sepolia
- **Revenue Sharing**: 80% to creators, 20% to platform
- **Web3 Dashboard**: Track NFT chatbots, earnings, and blockchain activity

### 🌐 **IPFS Storage & Auto-Generation**
- **Decentralized Metadata**: NFT metadata stored on IPFS via Pinata
- **Auto-Generation**: Automatically creates IPFS metadata from chatbot characteristics
- **Permanent Storage**: Immutable chatbot data and avatars
- **NFT Standards**: ERC721-compliant metadata structure
- **Enhanced AI Context**: IPFS metadata integration for richer chatbot personalities
- **Flexible Input**: Provide existing IPFS hash or let system auto-generate from traits

### 💬 **Conversation Engine**
- **AI-Powered**: Google Gemini 2.0 Flash integration for intelligent responses
- **Streaming Responses**: Real-time message streaming for better UX
- **Session Management**: Persistent chat history and context
- **Character Consistency**: AI responds based on defined characteristics

### 🎯 **Dual Mode Operation**
- **Regular Chatbots**: Database-only chatbots for standard AI conversations
- **NFT Chatbots**: Blockchain-enabled chatbots with ownership and monetization
- **Flexible Choice**: Users can choose which type to create

## 🏗️ Architecture

### **Frontend Stack**
- **Framework**: Next.js 15 with App Router
- **UI Components**: Radix UI + Tailwind CSS + DaisyUI
- **Icons**: Lucide React
- **State Management**: Apollo Client (GraphQL)
- **Authentication**: Clerk
- **Notifications**: Sonner (Toast notifications)
- **Deployment**: Vercel (Production ready)

### **Backend Stack**
- **Database**: PostgreSQL (Neon Cloud)
- **API**: GraphQL (Hasura Cloud)
- **AI**: Google Gemini 2.0 Flash API
- **Storage**: IPFS (Pinata Cloud)
- **Authentication**: Clerk backend integration

### **Blockchain Stack**
- **Smart Contracts**: Solidity 0.8.20
- **Framework**: Hardhat
- **Networks**: Ethereum Sepolia Testnet
- **Web3**: Ethers.js v5
- **Standards**: ERC721, ERC20, OpenZeppelin v5
- **Contract Verification**: Etherscan verified contracts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- MetaMask wallet (optional for basic features)
- Sepolia testnet ETH (for blockchain features)

### Installation

```bash
# Clone the repository
git clone https://github.com/Aashishvatwani/Ai-chatbot-builder.git
cd ai-chatpod

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys and configuration
```

### Environment Setup

Create `.env.local`:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (Hasura Cloud)
NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT=https://your-hasura-endpoint.hasura.app/v1/graphql
HASURA_ADMIN_SECRET=your_hasura_admin_secret

# AI Service (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Blockchain (Deployed Contracts - Sepolia Testnet)
NEXT_PUBLIC_CHATBOT_NFT_ADDRESS=0x5063a369B8ae4BbEC1C3fba44E77528b9bfc2802
NEXT_PUBLIC_CHAT_TOKEN_ADDRESS=0x154eC1d3d1e83EAc7486e8381A280F7fE3e668C1
NEXT_PUBLIC_NETWORK_ID=11155111
PRIVATE_KEY=your_wallet_private_key_for_deployment

# IPFS Storage (Pinata)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
PINATA_JWT=your_pinata_jwt_token

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start

# Deploy to Vercel
vercel --prod
```

## 🔧 Smart Contracts

### Deployed Contracts (Sepolia Testnet)

| Contract | Address | Purpose | Status |
|----------|---------|---------|---------|
| ChatToken | `0x154eC1d3d1e83EAc7486e8381A280F7fE3e668C1` | ERC20 token for payments | ✅ Verified |
| ChatbotNFT | `0x5063a369B8ae4BbEC1C3fba44E77528b9bfc2802` | ERC721 NFT for chatbot ownership | ✅ Verified |

**View on Etherscan:**
- [ChatToken Contract](https://sepolia.etherscan.io/address/0x154eC1d3d1e83EAc7486e8381A280F7fE3e668C1)
- [ChatbotNFT Contract](https://sepolia.etherscan.io/address/0x5063a369B8ae4BbEC1C3fba44E77528b9bfc2802)

### Contract Features

#### ChatToken (ERC20)
- **Total Supply**: 1,000,000 CHAT tokens
- **Decimals**: 18
- **Message Cost**: 10 CHAT per conversation
- **Revenue Split**: 8 CHAT to creator, 2 CHAT to platform
- **Minting**: Only owner can mint new tokens

#### ChatbotNFT (ERC721)
- **Metadata Storage**: IPFS with Pinata
- **Attributes**: Name, characteristics, creator, earnings tracking
- **Functionality**: Mint, transfer, revenue tracking, metadata updates
- **Royalties**: Built-in creator revenue sharing

## 🌐 IPFS Integration & Auto-Generation

### How IPFS Auto-Generation Works

When creating a chatbot, the system can automatically generate and upload rich metadata to IPFS:

1. **Chatbot Creation**: User creates chatbot with name and characteristics
2. **Auto-Generation**: If no IPFS hash provided, system generates metadata from characteristics
3. **IPFS Upload**: Metadata uploaded to IPFS via Pinata gateway
4. **Database Update**: Generated IPFS hash stored in chatbot record
5. **Enhanced AI**: Gemini AI receives rich context from IPFS metadata for better responses

### IPFS Metadata Structure

The auto-generated metadata follows this structure:

```json
{
  "name": "AI ChatBot: Your Bot Name",
  "description": "Your Bot Name - An intelligent conversational AI assistant with X unique characteristics.",
  "characteristics": ["friendly", "helpful", "knowledgeable"],
  "chatbot_type": "AI Assistant",
  "created_at": "2025-08-09T...",
  "chatbot_id": 123,
  "attributes": [
    {
      "trait_type": "Bot Type",
      "value": "AI Assistant"
    },
    {
      "trait_type": "Characteristics Count", 
      "value": 3
    },
    {
      "trait_type": "Platform",
      "value": "AI ChatPod"
    },
    {
      "trait_type": "Characteristic 1",
      "value": "friendly"
    }
  ]
}
```

### IPFS Setup Requirements

#### 1. Pinata Account Setup
1. Sign up at [Pinata.cloud](https://pinata.cloud)
2. Navigate to API Keys section
3. Create new API key with permissions:
   - `pinFileToIPFS`
   - `pinJSONToIPFS`
   - `userPinnedDataTotal`
4. Copy API Key and Secret Key

#### 2. Environment Variables
Add to your `.env.local`:
```env
# IPFS Storage (Pinata) - Required for auto-generation
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
```

#### 3. Database Schema Update
Ensure your database has the IPFS hash field:
```sql
-- Add IPFS hash column to chatbots table
ALTER TABLE chatbots ADD COLUMN ipfs_hash TEXT;

-- Add comment for documentation
COMMENT ON COLUMN chatbots.ipfs_hash IS 'IPFS hash for chatbot metadata stored on IPFS network';
```

#### 4. Hasura Schema Refresh
- Go to Hasura Console → Data → Reload Metadata
- Verify `ipfs_hash` field appears in GraphQL schema

### User Experience

#### Creating Chatbots with Auto IPFS:
1. **Fill Form**: Name and characteristics (optional IPFS hash field)
2. **Auto-Generation**: Leave IPFS hash empty → system auto-generates from characteristics
3. **Manual Input**: Provide existing IPFS hash → system uses provided metadata
4. **Enhanced AI**: Chatbot gets richer personality from IPFS context

#### What Users See:
- ✅ **"Generating IPFS metadata..."** - Auto-generation in progress
- ✅ **"IPFS metadata generated!"** - Success with hash stored
- ✅ **Enhanced AI responses** - Better context from IPFS metadata
- 🔄 **Fallback Support** - Works with basic characteristics if IPFS fails

### Testing IPFS Integration

```bash
# Test with provided IPFS hash
node test-ipfs-integration.js QmYourActualIPFSHash

# Check integration
npm run dev
# Create chatbot with characteristics
# Check console for auto-generation logs
```

## 🗄️ Database Schema

### Core Tables (PostgreSQL + Hasura)

```sql
-- Main chatbot information
CREATE TABLE chatbots (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    ipfs_hash TEXT, -- IPFS hash for enhanced metadata (auto-generated or manual)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chatbot personality traits
CREATE TABLE chatbot_characteristics (
    id SERIAL PRIMARY KEY,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guest users (non-registered visitors)
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat sessions
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE CASCADE,
    guest_id INT REFERENCES guests(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_session_id INT REFERENCES chat_sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sender VARCHAR(50) NOT NULL -- 'user' or 'ai'
);

-- NFT tracking (optional - for blockchain features)
CREATE TABLE chatbot_nfts (
    id SERIAL PRIMARY KEY,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE CASCADE,
    token_id VARCHAR(255) NOT NULL,
    contract_address VARCHAR(255) NOT NULL,
    metadata_ipfs_hash VARCHAR(255), -- IPFS hash for JSON metadata
    image_ipfs_hash VARCHAR(255),    -- IPFS hash for image file
    creator_address VARCHAR(255),    -- Wallet address of creator
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(token_id, contract_address)
);
```

### GraphQL Schema (Hasura)

The database is exposed via Hasura GraphQL API with the following key queries:

```graphql
# Get user's chatbots
query GetUserChatbots($userId: String!) {
  chatbots(where: { clerk_user_id: { _eq: $userId } }) {
    id
    name
    created_at
    chatbot_characteristics {
      id
      content
    }
    chat_sessions {
      id
      created_at
      messages {
        id
        content
        sender
        created_at
      }
    }
  }
}

# Get chat session with messages
query GetChatSession($sessionId: Int!) {
  chat_sessions_by_pk(id: $sessionId) {
    id
    chatbot {
      id
      name
      chatbot_characteristics {
        content
      }
    }
    messages(order_by: { created_at: asc }) {
      id
      content
      sender
      created_at
    }
  }
}
```

## 💰 Token Economy & Monetization

### How It Works
1. **Regular Chatbots**: Free to create and use
2. **NFT Chatbots**: Blockchain-enabled with monetization
3. **CHAT Token Usage**: 
   - Users pay 10 CHAT tokens per conversation
   - Creators receive 8 CHAT tokens (80%)
   - Platform receives 2 CHAT tokens (20%)
4. **NFT Benefits**: Tradeable ownership, automatic revenue sharing

### Getting CHAT Tokens
- **Test Faucet**: Get free tokens for Sepolia testing
- **NFT Creation**: Earn by creating popular chatbots
- **Future Trading**: DEX integration planned for mainnet

## 🎯 User Flows & Features

### 🔰 **Regular User Journey**
1. **Sign Up**: Create account with Clerk authentication
2. **Create Chatbot**: Design AI personality with characteristics
3. **Test & Deploy**: Chat with your bot to refine behavior
4. **Share**: Generate public links for others to interact
5. **Monitor**: View chat sessions and user feedback

### ⚡ **Advanced User Journey (Blockchain)**
1. **Connect Wallet**: Link MetaMask for Web3 features
2. **Create Premium Bot**: Enhanced chatbot with monetization
3. **Mint as NFT**: Store metadata on IPFS, mint on blockchain
4. **Earn Revenue**: Receive CHAT tokens from user interactions
5. **Trade NFTs**: Transfer ownership of successful chatbots

### 👥 **Guest User Experience**
1. **Discover Chatbots**: Browse public chatbot gallery
2. **Start Chatting**: Immediate interaction without registration
3. **Optional Registration**: Sign up to save chat history
4. **Premium Features**: Connect wallet for advanced interactions

## 🛠️ Development Commands

```bash
# Frontend Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint for code quality
npm run type-check   # TypeScript type checking

# Blockchain Development
npx hardhat compile  # Compile smart contracts
npx hardhat test     # Run contract tests
npx hardhat node     # Start local blockchain
npx hardhat console --network sepolia  # Interact with contracts

# Deployment
npx hardhat run scripts/deploy.js --network sepolia  # Deploy to testnet
npx hardhat verify --network sepolia CONTRACT_ADDRESS  # Verify on Etherscan
vercel --prod        # Deploy to Vercel
```

## 📂 Project Structure

```
ai-chatpod/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin dashboard pages
│   │   │   ├── create-chatpod/ # Chatbot creation
│   │   │   ├── edit-chatpod/  # Chatbot editing
│   │   │   ├── view-chatpods/ # Chatbot management
│   │   │   ├── settings/      # User settings + Web3 dashboard
│   │   │   └── review-session/ # Chat session reviews
│   │   ├── (guest)/           # Guest user pages
│   │   │   ├── chatbot/       # Chat interface
│   │   │   └── login/         # Authentication
│   │   └── api/               # API routes
│   │       ├── send-message/  # AI chat endpoint
│   │       └── graphql/       # GraphQL proxy
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── Web3Provider.tsx  # Blockchain context
│   │   ├── Web3Dashboard.tsx # Blockchain stats
│   │   └── ChatBotSession.tsx # Chat interface
│   ├── lib/                  # Utility libraries
│   │   ├── web3Service.ts    # Blockchain interactions
│   │   ├── ipfsService.ts    # IPFS/Pinata integration
│   │   └── utils.ts          # General utilities
│   └── types/                # TypeScript type definitions
├── contracts/                # Smart contracts
│   ├── ChatbotNFT.sol       # ERC721 NFT contract
│   ├── ChatToken.sol        # ERC20 token contract
│   └── abis/                # Contract ABIs
├── scripts/                 # Deployment scripts
├── graphql/                 # GraphQL operations
│   ├── queries/             # Query definitions
│   └── mutations/           # Mutation definitions
├── hardhat.config.js        # Hardhat configuration
├── database-update.sql      # Database schema
└── README.md               # This file
```

## 🔐 Security & Best Practices

### Smart Contract Security
- **OpenZeppelin Libraries**: Battle-tested, secure contract implementations
- **Access Control**: Owner-only functions with proper modifiers
- **Reentrancy Protection**: SafeMath and checks-effects-interactions pattern
- **Contract Verification**: All contracts verified on Etherscan
- **Testnet First**: Thorough testing on Sepolia before mainnet

### Application Security
- **Environment Variables**: All sensitive data in environment files
- **Authentication**: Clerk-based secure user management
- **API Security**: Hasura permissions and JWT validation
- **Input Validation**: Server-side validation for all user inputs
- **Rate Limiting**: API rate limiting to prevent abuse

### Data Privacy
- **User Data**: Minimal data collection, GDPR compliant
- **Chat Privacy**: Messages encrypted in transit
- **Blockchain Transparency**: Public blockchain data by design
- **IPFS Storage**: Immutable, distributed metadata storage

## 🚀 Deployment Guide

### Prerequisites for Deployment
- Vercel account (for frontend)
- Neon/PostgreSQL database
- Hasura Cloud instance
- Pinata IPFS account
- Google AI Studio (Gemini API)
- Sepolia testnet ETH

### Step-by-Step Deployment

#### 1. Database Setup (Neon)
```sql
-- Run the seed.sql file in your Neon console
-- This creates all necessary tables and sample data
```

#### 2. Hasura Configuration
- Connect Hasura to your Neon database
- Set up environment variables
- Configure permissions for authenticated users

#### 3. Smart Contract Deployment
```bash
# Deploy contracts to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify contracts
npx hardhat verify --network sepolia 0x5063a369B8ae4BbEC1C3fba44E77528b9bfc2802
npx hardhat verify --network sepolia 0x154eC1d3d1e83EAc7486e8381A280F7fE3e668C1
```

#### 4. Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables in Vercel dashboard
```

### Environment Variables Checklist
- [ ] Clerk authentication keys
- [ ] Hasura endpoint and admin secret  
- [ ] Gemini API key
- [ ] Contract addresses (post-deployment)
- [ ] Pinata API keys (for IPFS auto-generation)
- [ ] Base URL for production

## 📊 Performance & Monitoring

### Frontend Performance
- **Next.js Optimization**: Automatic code splitting and image optimization
- **Caching**: Apollo Client caching for GraphQL
- **Streaming**: Real-time AI response streaming
- **Responsive Design**: Mobile-first, progressive enhancement

### Backend Performance
- **Database Optimization**: Indexed queries, connection pooling
- **GraphQL Efficiency**: Query optimization, avoid N+1 problems
- **IPFS Caching**: Metadata caching for faster NFT loading
- **Rate Limiting**: API protection and fair usage

### Monitoring & Analytics
- **Vercel Analytics**: Frontend performance monitoring
- **Hasura Observability**: Query performance tracking
- **Custom Metrics**: User engagement and chatbot usage
- **Error Tracking**: Comprehensive error logging

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
1. **Fork the repository** on GitHub
2. **Clone your fork**: `git clone https://github.com/YOUR-USERNAME/ai-chatbot-builder.git`
3. **Install dependencies**: `npm install`
4. **Set up environment**: Copy `.env.example` to `.env.local`
5. **Start developing**: `npm run dev`

### Contribution Guidelines
- **Code Style**: Follow ESLint configuration
- **Type Safety**: Maintain TypeScript coverage
- **Testing**: Add tests for new features
- **Documentation**: Update README for significant changes
- **Commits**: Use conventional commit messages

### Pull Request Process
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Make your changes with tests
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to your fork (`git push origin feature/amazing-feature`)
5. Open a Pull Request with detailed description

## 🔧 Troubleshooting

### Common Issues

#### IPFS Auto-Generation Not Working
**Problem**: Chatbots created without IPFS metadata enhancement
```
✅ Check: Pinata API keys in .env.local
✅ Check: Database has ipfs_hash column
✅ Check: Hasura schema refreshed
✅ Check: Internet connection for IPFS upload
✅ Check: Console logs for error messages
```

**Quick Fix**:
```bash
# Test IPFS connection
node test-ipfs-integration.js

# Manual database update
ALTER TABLE chatbots ADD COLUMN ipfs_hash TEXT;

# Refresh Hasura metadata
# Go to Hasura Console → Data → Reload Metadata
```

#### GraphQL Errors During Chatbot Creation
**Problem**: `field 'ipfs_hash' not found in type: 'chatbots'`
```
✅ Add ipfs_hash column to database
✅ Refresh Hasura metadata
✅ Check GraphQL query includes new field
✅ Clear Apollo Client cache
```

#### AI Responses Lack IPFS Context
**Problem**: Chatbot responses don't reflect IPFS metadata
```
✅ Verify chatbot has ipfs_hash in database
✅ Check IPFS hash is accessible via Pinata gateway
✅ Monitor API route console logs for IPFS fetch
✅ Ensure metadata follows correct JSON structure
```

#### Build Errors
**Problem**: TypeScript compilation errors
```
✅ Check all imports are correct
✅ Verify environment variables are set
✅ Run npm install to update dependencies
✅ Clear .next cache: rm -rf .next
```

### Performance Optimization

#### IPFS Loading Speed
- Use Pinata's CDN for faster metadata access
- Cache IPFS metadata in database after first fetch
- Implement fallback to characteristics if IPFS fails

#### Database Queries
- Index frequently queried fields (user_id, chatbot_id)
- Use GraphQL query optimization
- Implement pagination for large datasets

## 🎯 Roadmap & Future Features

### 🔄 **Short Term (Q1 2025)**
- [ ] Enhanced AI personalities with GPT-4 integration
- [ ] Voice chat capabilities
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### 🚀 **Medium Term (Q2-Q3 2025)**
- [ ] Mainnet deployment (Ethereum/Polygon)
- [ ] DEX integration for CHAT token trading
- [ ] Advanced NFT traits and rarity system
- [ ] Chatbot marketplace with discovery
- [ ] API access for developers

### 🌟 **Long Term (Q4 2025+)**
- [ ] AI model fine-tuning for chatbots
- [ ] Cross-chain NFT support
- [ ] DAO governance for platform decisions
- [ ] Enterprise features and white-labeling
- [ ] Advanced monetization models

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 AI ChatPod Builder

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

Special thanks to the following technologies and communities:

- **[Next.js](https://nextjs.org/)** - The React framework for production
- **[OpenZeppelin](https://openzeppelin.com/)** - Secure smart contract libraries
- **[Clerk](https://clerk.dev/)** - Complete user management platform
- **[Hasura](https://hasura.io/)** - Instant GraphQL APIs
- **[Pinata](https://pinata.cloud/)** - IPFS infrastructure
- **[Google AI](https://ai.google/)** - Gemini AI model
- **[Vercel](https://vercel.com/)** - Deployment and hosting platform
- **[Neon](https://neon.tech/)** - Serverless PostgreSQL
- **[Ethereum](https://ethereum.org/)** - Blockchain infrastructure
- **[Hardhat](https://hardhat.org/)** - Ethereum development framework

## 📞 Support & Community

### Get Help
- **📚 Documentation**: Check the `/docs` folder for detailed guides
- **🐛 Bug Reports**: [Create an issue](https://github.com/Aashishvatwani/Ai-chatbot-builder/issues) on GitHub
- **💡 Feature Requests**: [Discussions tab](https://github.com/Aashishvatwani/Ai-chatbot-builder/discussions) for ideas
- **❓ Questions**: Use GitHub Discussions for community support

### Community Links
- **GitHub**: [Repository](https://github.com/Aashishvatwani/Ai-chatbot-builder)
- **Live Demo**: [Visit Platform](https://your-deployed-url.vercel.app)
- **Developer**: [@Aashishvatwani](https://github.com/Aashishvatwani)

### Contact
- **Email**: your-email@example.com
- **Twitter**: @YourTwitterHandle
- **LinkedIn**: Your LinkedIn Profile

---

## 🎉 **Quick Start Summary**

```bash
# 1. Clone and setup
git clone https://github.com/Aashishvatwani/Ai-chatbot-builder.git
cd ai-chatpod && npm install

# 2. Configure environment
cp .env.example .env.local
# Add your API keys

# 3. Start development
npm run dev

# 4. Open http://localhost:3000
# 5. Start building amazing AI chatbots! 🚀
```

**Built with ❤️ by the AI ChatPod team**

*Revolutionizing AI chatbots through blockchain technology*

---

**⭐ Star this repository if you find it useful!**
