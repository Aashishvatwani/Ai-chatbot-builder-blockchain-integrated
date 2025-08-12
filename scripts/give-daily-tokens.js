const hre = require("hardhat");

async function main() {
    // Contract address on Sepolia
    const CONTRACT_ADDRESS = "0x154eC1d3d1e83EAc7486e8381A280F7fE3e668C1";
    
    // Your second account that needs daily tokens
    const USER_TO_GIVE_TOKENS = "0x8861218f3bf122037828d3AA106e09d1D92F9499";

    // Get the contract
    const ChatToken = await hre.ethers.getContractFactory("ChatToken");
    const chatToken = ChatToken.attach(CONTRACT_ADDRESS);

    console.log("🎁 Giving daily tokens to user...");
    console.log("📋 Contract:", CONTRACT_ADDRESS);
    console.log("📋 User:", USER_TO_GIVE_TOKENS);

    try {
        // Check current owner
        const owner = await chatToken.owner();
        console.log("📋 Current contract owner:", owner);

        // Get current signer
        const [signer] = await hre.ethers.getSigners();
        console.log("📋 Current signer:", signer.address);

        // Check if signer is the owner
        if (signer.address.toLowerCase() !== owner.toLowerCase()) {
            console.log("❌ Error: Current signer is not the contract owner!");
            console.log("💡 Switch to the owner account in MetaMask and try again");
            return;
        }

        // Check user's current balance
        const balanceBefore = await chatToken.balanceOf(USER_TO_GIVE_TOKENS);
        console.log("📋 User balance before:", hre.ethers.utils.formatEther(balanceBefore), "CHAT");

        // Mint 0.01 CHAT tokens (daily amount)
        const dailyAmount = hre.ethers.utils.parseEther("0.01");
        console.log("🚀 Minting 0.01 CHAT tokens...");
        
        const tx = await chatToken.mintRewards(USER_TO_GIVE_TOKENS, dailyAmount);
        await tx.wait();
        
        console.log("✅ Daily tokens minted successfully!");
        console.log("📄 Transaction hash:", tx.hash);

        // Check user's balance after
        const balanceAfter = await chatToken.balanceOf(USER_TO_GIVE_TOKENS);
        console.log("📋 User balance after:", hre.ethers.utils.formatEther(balanceAfter), "CHAT");

    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.message.includes("Ownable: caller is not the owner")) {
            console.log("💡 Solution: Switch to the contract owner account in MetaMask");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
