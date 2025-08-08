const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deployer address:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Balance:", hre.ethers.utils.formatEther(balance), "ETH");
  
  if (balance.lt(hre.ethers.utils.parseEther("0.01"))) {
    console.log("⚠️  LOW BALANCE! You need more test ETH for deployment.");
    console.log("Get free Sepolia ETH from: https://sepoliafaucet.com/");
  } else {
    console.log("✅ Balance looks good for deployment!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
