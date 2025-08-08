// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChatbotNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct ChatbotMetadata {
        string name;
        string[] characteristics;
        uint256 conversationCount;
        uint256 createdAt;
        address creator;
        uint256 totalEarnings;
    }

    mapping(uint256 => ChatbotMetadata) public chatbots;
    mapping(uint256 => uint256) public chatbotToOffChainId; // Links to your DB
    mapping(address => uint256[]) public userChatbots;

    event ChatbotMinted(
        uint256 indexed tokenId, 
        address indexed creator, 
        string name,
        uint256 offChainId
    );
    
    event ConversationCompleted(
        uint256 indexed tokenId,
        address indexed user,
        uint256 reward
    );

    constructor() ERC721("AI ChatPod Bots", "AICB") Ownable(msg.sender) {}

    function mintChatbot(
        address to,
        string memory name,
        string[] memory characteristics,
        string memory uri,
        uint256 offChainId
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        chatbots[tokenId] = ChatbotMetadata({
            name: name,
            characteristics: characteristics,
            conversationCount: 0,
            createdAt: block.timestamp,
            creator: to,
            totalEarnings: 0
        });

        chatbotToOffChainId[tokenId] = offChainId;
        userChatbots[to].push(tokenId);

        emit ChatbotMinted(tokenId, to, name, offChainId);
        return tokenId;
    }

    function recordConversation(uint256 tokenId, uint256 reward) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Chatbot does not exist");
        
        chatbots[tokenId].conversationCount++;
        chatbots[tokenId].totalEarnings += reward;
        
        emit ConversationCompleted(tokenId, ownerOf(tokenId), reward);
    }

    function getChatbotMetadata(uint256 tokenId) 
        external 
        view 
        returns (ChatbotMetadata memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Chatbot does not exist");
        return chatbots[tokenId];
    }

    function getUserChatbots(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userChatbots[user];
    }

    // Override required functions
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
