const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Tests", function () {
  let tokenA;
  let tokenB;
  let factory;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署代币合约
    const TokenA = await ethers.getContractFactory("TokenA");
    tokenA = await TokenA.deploy();
    await tokenA.waitForDeployment();

    const TokenB = await ethers.getContractFactory("TokenB");
    tokenB = await TokenB.deploy();
    await tokenB.waitForDeployment();

    // 部署工厂合约
    const Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  describe("Token Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await tokenA.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await tokenA.balanceOf(owner.address);
      expect(await tokenA.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // 从owner转账50个代币到addr1
      await tokenA.transfer(addr1.address, 50);
      const addr1Balance = await tokenA.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // 从addr1转账50个代币到addr2
      await tokenA.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await tokenA.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await tokenA.balanceOf(owner.address);

      // 尝试从addr1转账1个代币到owner（应该失败）
      await expect(
        tokenA.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // owner的余额应该保持不变
      expect(await tokenA.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });

  describe("Factory", function () {
    it("Should create a new pair", async function () {
      await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
      const pairAddress = await factory.pairs(await tokenA.getAddress(), await tokenB.getAddress());
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);
    });
  });
}); 