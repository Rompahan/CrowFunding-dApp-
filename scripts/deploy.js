const hre = require("hardhat");

async function main() {
  //  Деплоим RewardToken
  const RewardToken = await hre.ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("RewardToken deployed to:", rewardTokenAddress);

  // Деплоим CrowdFund 
  const CrowdFund = await hre.ethers.getContractFactory("CrowdFund");
  const crowdfunding = await CrowdFund.deploy(rewardTokenAddress, 100); 
  await crowdfunding.waitForDeployment();
  const crowdfundingAddress = await crowdfunding.getAddress();
  console.log("CrowdFund deployed to:", crowdfundingAddress);

  // Назначаем контракт CrowdFund "минтером"
  const tx = await rewardToken.setMinter(crowdfundingAddress);
  await tx.wait();
  console.log("CrowdFund set as Minter for RewardToken");

  console.log("\n!!DEPLOYMENT FINISHED!!");
  console.log("Token Address:", rewardTokenAddress);
  console.log("Crowdfunding Address:", crowdfundingAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});