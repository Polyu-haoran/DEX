const hre = require("hardhat");

async function main() {
  // 获取测试账户（第1个账户为部署者，第2个为测试用户）
  const [deployer, tester] = await hre.ethers.getSigners();

  // 部署代币 TKA, TKB, TKC
  const TokenA = await hre.ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy();
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("TKA 地址:", tokenAAddress);

  const TokenB = await hre.ethers.getContractFactory("TokenB");
  const tokenB = await TokenB.deploy();
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("TKB 地址:", tokenBAddress);

  const TokenC = await hre.ethers.getContractFactory("TokenC");
  const tokenC = await TokenC.deploy();
  await tokenC.waitForDeployment();
  const tokenCAddress = await tokenC.getAddress();
  console.log("TKC 地址:", tokenCAddress);

  // 给测试账户分配代币（各1000个）
  const transferAmount = hre.ethers.parseEther("1000"); // 1000 个代币（18 decimals）
  await tokenA.transfer(tester.address, transferAmount);
  await tokenB.transfer(tester.address, transferAmount);
  await tokenC.transfer(tester.address, transferAmount);
  console.log(`已向测试账户 ${tester.address} 分配 1000 TKA, TKB 和 TKC`);

  // 部署 Factory 合约
  const Factory = await hre.ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory 合约地址:", factoryAddress);

  // 创建交易对：TKA/TKB, TKA/TKC, TKB/TKC
  const pairs = [
    { label: "TKA/TKB", tokenA: tokenAAddress, tokenB: tokenBAddress },
    { label: "TKA/TKC", tokenA: tokenAAddress, tokenB: tokenCAddress },
    { label: "TKB/TKC", tokenA: tokenBAddress, tokenB: tokenCAddress },
  ];

  const pairAddresses = {};

  for (const pair of pairs) {
    await factory.createPair(pair.tokenA, pair.tokenB);
    // 根据 Factory.sol，使用 pairs 映射获取交易对地址
    const pairAddress = await factory.pairs(pair.tokenA, pair.tokenB);
    pairAddresses[pair.label] = pairAddress;
    console.log(`创建交易对: ${pair.label}, Pair 地址: ${pairAddress}`);
  }

  // 为每个交易对添加初始流动性（各10000个代币）
  const liquidityAmount = hre.ethers.parseEther("10000");

  for (const pair of pairs) {
    const pairAddress = pairAddresses[pair.label];
    const Pair = await hre.ethers.getContractFactory("Pair");
    const pairContract = Pair.attach(pairAddress);

    // 根据交易对授权对应的两种代币
    if (pair.label === "TKA/TKB") {
      await tokenA.approve(pairAddress, liquidityAmount);
      await tokenB.approve(pairAddress, liquidityAmount);
    } else if (pair.label === "TKA/TKC") {
      await tokenA.approve(pairAddress, liquidityAmount);
      await tokenC.approve(pairAddress, liquidityAmount);
    } else if (pair.label === "TKB/TKC") {
      await tokenB.approve(pairAddress, liquidityAmount);
      await tokenC.approve(pairAddress, liquidityAmount);
    }

    // 添加流动性
    await pairContract.addLiquidity(liquidityAmount, liquidityAmount);
    console.log(`已为交易对 ${pair.label} 添加初始流动性: ${hre.ethers.formatEther(liquidityAmount)} 代币`);
  }

  // 输出前端需要的地址配置
  console.log("\n前端地址配置:");
  console.log(`const TOKEN_A_ADDRESS = "${tokenAAddress}";`);
  console.log(`const TOKEN_B_ADDRESS = "${tokenBAddress}";`);
  console.log(`const TOKEN_C_ADDRESS = "${tokenCAddress}";`);
  console.log(`const PAIR_AB_ADDRESS = "${pairAddresses['TKA/TKB']}";`);
  console.log(`const PAIR_AC_ADDRESS = "${pairAddresses['TKA/TKC']}";`);
  console.log(`const PAIR_BC_ADDRESS = "${pairAddresses['TKB/TKC']}";`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 