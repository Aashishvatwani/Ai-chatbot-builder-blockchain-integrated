## Deployment Commands

# 1. Deploy to Sepolia Testnet
npx hardhat run scripts/deploy.js --network sepolia

# 2. Verify contracts on Etherscan
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS

# 3. Deploy to Polygon Mumbai
npx hardhat run scripts/deploy.js --network mumbai

# 4. Deploy to Arbitrum Goerli  
npx hardhat run scripts/deploy.js --network arbitrumGoerli

# 5. Test deployment locally
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
