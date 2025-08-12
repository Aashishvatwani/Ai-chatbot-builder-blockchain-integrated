// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RealChatToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M tokens
    uint256 public constant MESSAGE_COST = 1 * 10**15; // 0.001 tokens per message (very small)
    uint256 public constant DEMO_AMOUNT = 1 * 10**16; // 0.01 tokens for demo (real value!)
    
    // Demo token limits to prevent abuse
    mapping(address => bool) public hasClaimed;
    mapping(address => uint256) public lastClaimTime;
    uint256 public constant CLAIM_COOLDOWN = 24 hours; // Once per day
    
    uint256 public totalDemoTokensClaimed;
    uint256 public maxDemoTokens = 10000 * 10**18; // Limit total demo distribution
    
    event DemoTokensClaimed(address indexed user, uint256 amount);
    event MessageSent(address indexed user, uint256 cost);

    constructor() ERC20("Real ChatPod Token", "RCHAT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // Function for users to claim demo tokens with real value
    function claimDemoTokens() external {
        require(!hasClaimed[msg.sender] || 
                block.timestamp >= lastClaimTime[msg.sender] + CLAIM_COOLDOWN, 
                "Already claimed or too soon");
        require(totalDemoTokensClaimed + DEMO_AMOUNT <= maxDemoTokens, 
                "Demo token limit reached");
        
        hasClaimed[msg.sender] = true;
        lastClaimTime[msg.sender] = block.timestamp;
        totalDemoTokensClaimed += DEMO_AMOUNT;
        
        _transfer(owner(), msg.sender, DEMO_AMOUNT);
        
        emit DemoTokensClaimed(msg.sender, DEMO_AMOUNT);
    }

    // Process message payment (very small cost)
    function processMessage(address user) external returns (bool) {
        require(balanceOf(user) >= MESSAGE_COST, "Insufficient balance");
        
        _transfer(user, owner(), MESSAGE_COST);
        
        emit MessageSent(user, MESSAGE_COST);
        return true;
    }

    // Owner can add more tokens for demo distribution
    function addDemoTokens(uint256 amount) external onlyOwner {
        maxDemoTokens += amount;
    }

    // Get user's claim status
    function getClaimInfo(address user) external view returns (
        bool hasClaimedBefore,
        uint256 lastClaim,
        bool canClaimNow,
        uint256 nextClaimTime
    ) {
        hasClaimedBefore = hasClaimed[user];
        lastClaim = lastClaimTime[user];
        canClaimNow = !hasClaimedBefore || block.timestamp >= lastClaim + CLAIM_COOLDOWN;
        nextClaimTime = hasClaimedBefore ? lastClaim + CLAIM_COOLDOWN : 0;
    }
}
