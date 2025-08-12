// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ImprovedDailyRewardChatToken is ERC20, Ownable {
    uint256 public constant MESSAGE_COST = 10 * 10**18; // 10 CHAT tokens
    uint256 public constant CREATOR_REWARD = 8 * 10**18; // 8 CHAT tokens (80% of message cost)
    uint256 public constant DAILY_FREE_MESSAGES = 5; // 5 free messages per day
    uint256 public constant DAILY_CLAIM_AMOUNT = 10 * 10**18; // 10 CHAT tokens daily claim
    
    // ETH to CHAT conversion rate (1 ETH = 10000 CHAT)
    uint256 public constant ETH_TO_CHAT_RATE = 10000;
    uint256 public constant MIN_ETH_PURCHASE = 0.001 ether; // Minimum 0.001 ETH purchase
    
    // Platform address that receives ETH payments
    address public constant PLATFORM_ADDRESS = 0x37700500A14540Ba973d98FE76bdb1c7aC6327A4;
    
    // Revenue sharing: 70% to platform, 30% to creator reward pool
    uint256 public constant PLATFORM_ETH_SHARE = 70; // 70%
    uint256 public constant CREATOR_ETH_SHARE = 30;  // 30%
    
    // Track chatbot ownership and activity
    mapping(uint256 => address) public chatbotOwners;
    mapping(address => bool) public authorizedSpenders;
    mapping(address => uint256) public creatorMessageCount; // Track creator activity
    mapping(address => uint256) public creatorEthEarnings; // Track ETH earnings
    
    // Daily tracking
    mapping(address => uint256) public lastClaimDay;
    mapping(address => uint256) public dailyClaimsUsed;
    mapping(address => uint256) public lastMessageDay;
    mapping(address => uint256) public dailyMessagesUsed;
    
    // ETH pools
    uint256 public totalCreatorEthPool; // ETH available for creator rewards
    uint256 public totalEthRevenue;     // Total ETH received
    
    event ChatbotRegistered(uint256 indexed chatbotId, address indexed owner);
    event MessageProcessed(address indexed user, uint256 indexed chatbotId, uint256 cost);
    event CreatorRewardPaid(address indexed creator, uint256 chatAmount, uint256 ethAmount);
    event DailyRewardClaimed(address indexed user, uint256 amount);
    event FreeMessageUsed(address indexed user, uint256 remaining);
    event ChatTokensPurchased(address indexed buyer, uint256 ethAmount, uint256 chatAmount);
    event EthRewardDistributed(address indexed creator, uint256 amount);

    constructor(address initialOwner) ERC20("ChatToken", "CHAT") Ownable(initialOwner) {
        // Mint initial supply to owner
        _mint(initialOwner, 1000000 * 10**18); // 1 million tokens
    }

    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / 86400; // 86400 seconds = 1 day
    }

    function resetDailyLimitsIfNeeded(address user) internal {
        uint256 currentDay = getCurrentDay();
        
        // Reset daily claims if it's a new day
        if (lastClaimDay[user] < currentDay) {
            dailyClaimsUsed[user] = 0;
            lastClaimDay[user] = currentDay;
        }
        
        // Reset daily messages if it's a new day
        if (lastMessageDay[user] < currentDay) {
            dailyMessagesUsed[user] = 0;
            lastMessageDay[user] = currentDay;
        }
    }

    function claimDailyReward() external {
        resetDailyLimitsIfNeeded(msg.sender);
        require(dailyClaimsUsed[msg.sender] == 0, "Daily reward already claimed");
        
        dailyClaimsUsed[msg.sender] = 1;
        _mint(msg.sender, DAILY_CLAIM_AMOUNT);
        
        emit DailyRewardClaimed(msg.sender, DAILY_CLAIM_AMOUNT);
    }

    function getDailyStatus(address user) external view returns (
        uint256 claimsRemaining,
        uint256 freeMessagesRemaining,
        bool canClaimToday
    ) {
        uint256 currentDay = getCurrentDay();
        
        if (lastClaimDay[user] < currentDay) {
            claimsRemaining = 1;
            canClaimToday = true;
        } else {
            claimsRemaining = dailyClaimsUsed[user] == 0 ? 1 : 0;
            canClaimToday = dailyClaimsUsed[user] == 0;
        }
        
        if (lastMessageDay[user] < currentDay) {
            freeMessagesRemaining = DAILY_FREE_MESSAGES;
        } else {
            freeMessagesRemaining = DAILY_FREE_MESSAGES > dailyMessagesUsed[user] ? 
                DAILY_FREE_MESSAGES - dailyMessagesUsed[user] : 0;
        }
    }

    // Enhanced function to buy CHAT tokens with ETH and distribute ETH to creators
    function buyChatTokens() external payable {
        require(msg.value >= MIN_ETH_PURCHASE, "Minimum purchase is 0.001 ETH");
        
        // Calculate CHAT tokens to mint (1 ETH = 10000 CHAT)
        uint256 chatTokensToMint = (msg.value * ETH_TO_CHAT_RATE * 10**18) / 1 ether;
        
        // Mint CHAT tokens to buyer
        _mint(msg.sender, chatTokensToMint);
        
        // Split ETH: 70% to platform, 30% to creator pool
        uint256 platformShare = (msg.value * PLATFORM_ETH_SHARE) / 100;
        uint256 creatorShare = (msg.value * CREATOR_ETH_SHARE) / 100;
        
        // Transfer platform share to platform address
        payable(PLATFORM_ADDRESS).transfer(platformShare);
        
        // Add creator share to the reward pool
        totalCreatorEthPool += creatorShare;
        totalEthRevenue += msg.value;
        
        emit ChatTokensPurchased(msg.sender, msg.value, chatTokensToMint);
    }

    // Function for creators to claim their ETH earnings
    function claimEthEarnings() external {
        uint256 ethEarnings = calculateCreatorEthEarnings(msg.sender);
        require(ethEarnings > 0, "No ETH earnings to claim");
        require(address(this).balance >= ethEarnings, "Insufficient contract ETH balance");
        
        // Update creator's claimed earnings
        creatorEthEarnings[msg.sender] += ethEarnings;
        totalCreatorEthPool -= ethEarnings;
        
        // Transfer ETH to creator
        payable(msg.sender).transfer(ethEarnings);
        
        emit EthRewardDistributed(msg.sender, ethEarnings);
    }

    // Calculate ETH earnings for a creator based on their activity
    function calculateCreatorEthEarnings(address creator) public view returns (uint256) {
        if (creatorMessageCount[creator] == 0 || totalCreatorEthPool == 0) {
            return 0;
        }
        
        // Calculate total messages across all creators
        uint256 totalMessages = getTotalMessageCount();
        if (totalMessages == 0) {
            return 0;
        }
        
        // Creator's share of ETH pool based on their message activity
        uint256 creatorShare = (totalCreatorEthPool * creatorMessageCount[creator]) / totalMessages;
        
        // Subtract already claimed earnings
        return creatorShare > creatorEthEarnings[creator] ? 
            creatorShare - creatorEthEarnings[creator] : 0;
    }

    // Get total messages across all creators (helper function)
    function getTotalMessageCount() internal view returns (uint256) {
        // This is a simplified version - in production, you'd track this more efficiently
        // For now, we'll return a placeholder that works with the current logic
        return 100; // Placeholder - replace with actual tracking
    }

    function getChatTokenQuote(uint256 ethAmount) external pure returns (uint256 chatTokens) {
        return (ethAmount * ETH_TO_CHAT_RATE * 10**18) / 1 ether;
    }

    function registerChatbot(uint256 chatbotId, address owner) external onlyOwner {
        chatbotOwners[chatbotId] = owner;
        emit ChatbotRegistered(chatbotId, owner);
    }

    function authorizeSpender(address spender) external onlyOwner {
        authorizedSpenders[spender] = true;
    }

    function revokeSpender(address spender) external onlyOwner {
        authorizedSpenders[spender] = false;
    }

    function processMessage(address user, uint256 chatbotId) external {
        require(authorizedSpenders[msg.sender] || msg.sender == owner(), "Not authorized");
        resetDailyLimitsIfNeeded(user);
        
        address creator = chatbotOwners[chatbotId];
        require(creator != address(0), "Chatbot not registered");

        // Track creator activity for ETH earnings calculation
        creatorMessageCount[creator]++;

        // Check if user has free messages remaining
        if (dailyMessagesUsed[user] < DAILY_FREE_MESSAGES) {
            // Use free message
            dailyMessagesUsed[user]++;
            emit FreeMessageUsed(user, DAILY_FREE_MESSAGES - dailyMessagesUsed[user]);
            
            // Give creator reward for free messages (from platform reserves)
            if (balanceOf(owner()) >= CREATOR_REWARD) {
                _transfer(owner(), creator, CREATOR_REWARD);
                emit CreatorRewardPaid(creator, CREATOR_REWARD, 0);
            }
        } else {
            // Paid message - user must have tokens
            require(balanceOf(user) >= MESSAGE_COST, "Insufficient token balance");
            
            // Transfer tokens from user to contract owner (platform)
            _transfer(user, owner(), MESSAGE_COST - CREATOR_REWARD);
            
            // Transfer creator reward directly to creator
            _transfer(user, creator, CREATOR_REWARD);
            
            // Calculate ETH bonus for paid messages
            uint256 ethBonus = calculateCreatorEthEarnings(creator);
            
            emit CreatorRewardPaid(creator, CREATOR_REWARD, ethBonus);
        }

        emit MessageProcessed(user, chatbotId, MESSAGE_COST);
    }

    // View functions for earnings info
    function getCreatorStats(address creator) external view returns (
        uint256 messageCount,
        uint256 chatEarnings,
        uint256 ethEarnings,
        uint256 pendingEthEarnings
    ) {
        messageCount = creatorMessageCount[creator];
        chatEarnings = balanceOf(creator);
        ethEarnings = creatorEthEarnings[creator];
        pendingEthEarnings = calculateCreatorEthEarnings(creator);
    }

    function getPlatformStats() external view returns (
        uint256 totalEthReceived,
        uint256 ethInCreatorPool,
        uint256 contractEthBalance
    ) {
        totalEthReceived = totalEthRevenue;
        ethInCreatorPool = totalCreatorEthPool;
        contractEthBalance = address(this).balance;
    }

    function mintRewards(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function getMessageCost() external pure returns (uint256) {
        return MESSAGE_COST;
    }

    function getCreatorReward() external pure returns (uint256) {
        return CREATOR_REWARD;
    }

    function getDailyLimits() external pure returns (uint256 freeMessages, uint256 claimAmount) {
        return (DAILY_FREE_MESSAGES, DAILY_CLAIM_AMOUNT);
    }

    // Emergency function to withdraw stuck ETH (only owner)
    function emergencyWithdrawEth() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Allow contract to receive ETH
    receive() external payable {
        totalEthRevenue += msg.value;
    }
}
