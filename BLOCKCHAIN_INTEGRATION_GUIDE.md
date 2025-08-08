# Blockchain Integration Dependencies

## Required NPM Packages

```bash
# Web3 & Blockchain
npm install ethers@^5.7.2
npm install @web3-react/core @web3-react/injected-connector
npm install ipfs-http-client

# Additional UI Components
npm install @radix-ui/react-switch @radix-ui/react-progress

# Development Dependencies
npm install --save-dev @types/node
```

## Environment Variables

Add these to your `.env.local`:

```env
# Blockchain Configuration
NEXT_PUBLIC_CHATBOT_NFT_ADDRESS=0x... # Your deployed ChatbotNFT contract
NEXT_PUBLIC_CHAT_TOKEN_ADDRESS=0x... # Your deployed ChatToken contract
NEXT_PUBLIC_NETWORK_ID=1 # 1 for mainnet, 5 for goerli, etc.
NEXT_PUBLIC_INFURA_ID=your_infura_project_id

# IPFS Configuration
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret

# Smart Contract Configuration
PRIVATE_KEY=your_deployment_private_key # For contract deployment only
ETHERSCAN_API_KEY=your_etherscan_api_key # For contract verification
```

## Database Schema Updates

Add these tables to your PostgreSQL database:

```sql
-- NFT tracking
CREATE TABLE chatbot_nfts (
    id SERIAL PRIMARY KEY,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE CASCADE,
    token_id VARCHAR(255) NOT NULL,
    contract_address VARCHAR(255) NOT NULL,
    minted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(token_id, contract_address)
);

-- User wallet information
CREATE TABLE user_wallets (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(255) UNIQUE NOT NULL,
    token_balance VARCHAR(255) DEFAULT '0',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Blockchain transaction tracking
CREATE TABLE blockchain_transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    amount VARCHAR(255) NOT NULL,
    token_type VARCHAR(10) NOT NULL, -- 'CHAT', 'ETH', etc.
    chatbot_id INT REFERENCES chatbots(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Conversation payments
CREATE TABLE conversation_payments (
    id SERIAL PRIMARY KEY,
    chat_session_id INT REFERENCES chat_sessions(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255),
    amount VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

## Smart Contract Deployment

1. Install Hardhat:
```bash
npm install --save-dev hardhat @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle
```

2. Create `hardhat.config.js`:
```javascript
require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.19",
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

3. Deploy contracts:
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network goerli
```

## Integration Steps

1. **Update Layout**: Wrap your app with `Web3Provider`
2. **Add Wallet Connection**: Include wallet connection in header
3. **Enhance Chatbot Creation**: Add NFT minting option
4. **Token Economy**: Implement pay-per-message system
5. **Dashboard**: Show NFT collection and earnings
6. **Marketplace**: Create NFT trading interface

## Additional Features to Consider

- **Staking**: Users can stake tokens for premium features
- **DAO Governance**: Token holders vote on platform decisions
- **Revenue Sharing**: Distribute platform fees to token holders
- **Cross-chain**: Support multiple blockchains
- **DeFi Integration**: Yield farming with conversation earnings
