const hre = require("hardhat");

async function main() {
  // 部署代币合约
  const TokenA = await hre.ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy();
  await tokenA.waitForDeployment();
  console.log("TokenA deployed to:", await tokenA.getAddress());

  const TokenB = await hre.ethers.getContractFactory("TokenB");
  const tokenB = await TokenB.deploy();
  await tokenB.waitForDeployment();
  console.log("TokenB deployed to:", await tokenB.getAddress());

  const TokenC = await hre.ethers.getContractFactory("TokenC");
  const tokenC = await TokenC.deploy();
  await tokenC.waitForDeployment();
  console.log("TokenC deployed to:", await tokenC.getAddress());

  // 部署工厂合约
  const Factory = await hre.ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  console.log("Factory deployed to:", await factory.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 