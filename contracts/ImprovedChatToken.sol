// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ImprovedChatToken
 * @dev A better version that doesn't require pre-registration of chatbots
 */
contract ImprovedChatToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M tokens
    uint256 public constant MESSAGE_COST = 1 * 10**15; // 0.001 CHAT tokens per message (much cheaper!)
    uint256 public constant CREATOR_PERCENTAGE = 80; // 80% to creator
    uint256 public constant PLATFORM_PERCENTAGE = 20; // 20% to platform

    // Events
    event MessagePaid(
        address indexed user,
        address indexed creator,
        uint256 chatbotId,
        uint256 totalCost,
        uint256 creatorAmount,
        uint256 platformAmount
    );

    constructor() ERC20("ChatPod Token", "CHAT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Process payment for any chatbot - no pre-registration needed
     * @param creator The address that should receive creator rewards
     * @param chatbotId The ID of the chatbot (for tracking purposes)
     */
    function processMessagePayment(
        address creator,
        uint256 chatbotId
    ) external returns (bool) {
        require(balanceOf(msg.sender) >= MESSAGE_COST, "Insufficient balance");
        require(creator != address(0), "Invalid creator address");

        uint256 creatorAmount = (MESSAGE_COST * CREATOR_PERCENTAGE) / 100;
        uint256 platformAmount = MESSAGE_COST - creatorAmount;

        // Transfer tokens
        _transfer(msg.sender, creator, creatorAmount);
        _transfer(msg.sender, owner(), platformAmount);

        emit MessagePaid(
            msg.sender,
            creator,
            chatbotId,
            MESSAGE_COST,
            creatorAmount,
            platformAmount
        );

        return true;
    }

    /**
     * @dev Simplified payment to platform (for unowned chatbots)
     * @param chatbotId The ID of the chatbot (for tracking purposes)
     */
    function processSimplePayment(uint256 chatbotId) external returns (bool) {
        require(balanceOf(msg.sender) >= MESSAGE_COST, "Insufficient balance");

        // All tokens go to platform for free/community chatbots
        _transfer(msg.sender, owner(), MESSAGE_COST);

        emit MessagePaid(
            msg.sender,
            owner(),
            chatbotId,
            MESSAGE_COST,
            0,
            MESSAGE_COST
        );

        return true;
    }

    /**
     * @dev Mint tokens for testing (only owner)
     */
    function mintTokens(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function getMessageCost() external pure returns (uint256) {
        return MESSAGE_COST;
    }
}
