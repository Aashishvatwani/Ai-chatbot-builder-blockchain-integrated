// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DailyRewardChatToken is ERC20, Ownable {
    uint256 public constant MESSAGE_COST = 10 * 10**18; // 10 CHAT tokens
    uint256 public constant CREATOR_REWARD = 8 * 10**18; // 8 CHAT tokens (80% of message cost)
    uint256 public constant DAILY_FREE_MESSAGES = 5; // 5 free messages per day
    uint256 public constant DAILY_CLAIM_AMOUNT = 10 * 10**18; // 10 CHAT tokens daily claim
    
    // ETH to CHAT conversion rate (1 ETH = 10000 CHAT)
    uint256 public constant ETH_TO_CHAT_RATE = 10000;
    uint256 public constant MIN_ETH_PURCHASE = 0.001 ether; // Minimum 0.001 ETH purchase
    
    // Platform address that receives all ETH payments
    address public constant PLATFORM_ADDRESS = 0x37700500A14540Ba973d98FE76bdb1c7aC6327A4;
    
    // Track chatbot ownership
    mapping(uint256 => address) public chatbotOwners;
    
    // Track authorized spenders for contract operations
    mapping(address => bool) public authorizedSpenders;
    
    // Daily tracking
    mapping(address => uint256) public lastClaimDay;
    mapping(address => uint256) public dailyClaimsUsed;
    mapping(address => uint256) public lastMessageDay;
    mapping(address => uint256) public dailyMessagesUsed;
    
    event ChatbotRegistered(uint256 indexed chatbotId, address indexed owner);
    event MessageProcessed(address indexed user, uint256 indexed chatbotId, uint256 cost);
    event CreatorRewardPaid(address indexed creator, uint256 amount);
    event DailyRewardClaimed(address indexed user, uint256 amount);
    event FreeMessageUsed(address indexed user, uint256 remaining);
    event ChatTokensPurchased(address indexed buyer, uint256 ethAmount, uint256 chatAmount);

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

    function getUserDailyStatus(address user) external view returns (
        uint256 freeMessagesRemaining,
        bool canClaimDaily,
        uint256 dailyClaimsRemaining
    ) {
        uint256 currentDay = getCurrentDay();
        
        // Calculate free messages remaining
        if (lastMessageDay[user] < currentDay) {
            freeMessagesRemaining = DAILY_FREE_MESSAGES;
        } else {
            freeMessagesRemaining = dailyMessagesUsed[user] >= DAILY_FREE_MESSAGES ? 0 : DAILY_FREE_MESSAGES - dailyMessagesUsed[user];
        }
        
        // Check if can claim daily reward
        canClaimDaily = lastClaimDay[user] < currentDay;
        
        // Calculate daily claims remaining (1 per day)
        if (lastClaimDay[user] < currentDay) {
            dailyClaimsRemaining = 1;
        } else {
            dailyClaimsRemaining = dailyClaimsUsed[user] >= 1 ? 0 : 1 - dailyClaimsUsed[user];
        }
    }

    function claimDailyReward() external {
        resetDailyLimitsIfNeeded(msg.sender);
        
        require(dailyClaimsUsed[msg.sender] == 0, "Daily reward already claimed");
        
        dailyClaimsUsed[msg.sender] = 1;
        _mint(msg.sender, DAILY_CLAIM_AMOUNT);
        
        emit DailyRewardClaimed(msg.sender, DAILY_CLAIM_AMOUNT);
    }

    // Function to buy CHAT tokens with ETH
    function buyChatTokens() external payable {
        require(msg.value >= MIN_ETH_PURCHASE, "Minimum purchase is 0.001 ETH");
        
        // Calculate CHAT tokens to mint (1 ETH = 10000 CHAT)
        uint256 chatTokensToMint = (msg.value * ETH_TO_CHAT_RATE * 10**18) / 1 ether;
        
        // Mint CHAT tokens to buyer
        _mint(msg.sender, chatTokensToMint);
        
        // Transfer ETH to platform address
        payable(PLATFORM_ADDRESS).transfer(msg.value);
        
        emit ChatTokensPurchased(msg.sender, msg.value, chatTokensToMint);
    }

    // Function to get purchase quote
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

        // Check if user has free messages remaining
        if (dailyMessagesUsed[user] < DAILY_FREE_MESSAGES) {
            // Use free message
            dailyMessagesUsed[user]++;
            emit FreeMessageUsed(user, DAILY_FREE_MESSAGES - dailyMessagesUsed[user]);
            
            // Still give creator a small reward for free messages (from platform reserves)
            if (balanceOf(owner()) >= CREATOR_REWARD) {
                _transfer(owner(), creator, CREATOR_REWARD);
                emit CreatorRewardPaid(creator, CREATOR_REWARD);
            }
        } else {
            // Paid message - user must have tokens
            require(balanceOf(user) >= MESSAGE_COST, "Insufficient token balance");
            
            // Transfer tokens from user to contract owner (platform)
            _transfer(user, owner(), MESSAGE_COST - CREATOR_REWARD);
            
            // Transfer creator reward directly to creator
            _transfer(user, creator, CREATOR_REWARD);
            
            emit CreatorRewardPaid(creator, CREATOR_REWARD);
        }

        emit MessageProcessed(user, chatbotId, MESSAGE_COST);
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

    function getPurchaseInfo() external pure returns (uint256 rate, uint256 minPurchase, address platformAddress) {
        return (ETH_TO_CHAT_RATE, MIN_ETH_PURCHASE, PLATFORM_ADDRESS);
    }
}
