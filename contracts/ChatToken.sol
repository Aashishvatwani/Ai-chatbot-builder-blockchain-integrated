// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChatToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M tokens
    uint256 public constant MESSAGE_COST = 10 * 10**18; // 10 tokens per message
    uint256 public constant CREATOR_REWARD = 8 * 10**18; // 8 tokens to creator
    uint256 public constant PLATFORM_FEE = 2 * 10**18; // 2 tokens to platform

    mapping(address => bool) public authorizedSpenders;
    mapping(uint256 => address) public chatbotOwners; // tokenId => owner
    
    event MessageSent(
        address indexed user,
        uint256 indexed chatbotId,
        uint256 cost,
        uint256 creatorReward
    );

    event TokensEarned(
        address indexed creator,
        uint256 indexed chatbotId,
        uint256 amount
    );

    constructor() ERC20("ChatPod Token", "CHAT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function authorizeSpender(address spender, bool authorized) external onlyOwner {
        authorizedSpenders[spender] = authorized;
    }

    function setChatbotOwner(uint256 chatbotId, address owner) external onlyOwner {
        chatbotOwners[chatbotId] = owner;
    }

    function processMessage(
        address user,
        uint256 chatbotId
    ) external returns (bool) {
        require(authorizedSpenders[msg.sender], "Unauthorized spender");
        require(balanceOf(user) >= MESSAGE_COST, "Insufficient balance");
        
        address creator = chatbotOwners[chatbotId];
        require(creator != address(0), "Invalid chatbot");

        // Transfer tokens
        _transfer(user, creator, CREATOR_REWARD);
        _transfer(user, owner(), PLATFORM_FEE);

        emit MessageSent(user, chatbotId, MESSAGE_COST, CREATOR_REWARD);
        emit TokensEarned(creator, chatbotId, CREATOR_REWARD);

        return true;
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
}
