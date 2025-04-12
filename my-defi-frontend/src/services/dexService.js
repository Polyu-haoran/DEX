import { ethers } from 'ethers';
import { blockchainService } from './blockchainService';
import {
  TOKEN_A_ADDRESS,
  TOKEN_B_ADDRESS,
  TOKEN_C_ADDRESS,
  FACTORY_ADDRESS,
  PAIR_AB_ADDRESS,
  PAIR_AC_ADDRESS,
  PAIR_BC_ADDRESS
} from '../config/contracts';

// 合约 ABI
const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function transferFrom(address,address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

const FACTORY_ABI = [
  "function createPair(address,address) returns (address)",
  "function pairs(address,address) view returns (address)",
  "function allPairs(uint256) view returns (address)",
  "function getPair(address,address) view returns (address)"
];

const PAIR_ABI = [
  "function tokenA() view returns (address)",
  "function tokenB() view returns (address)",
  "function reserveA() view returns (uint256)",
  "function reserveB() view returns (uint256)",
  "function addLiquidity(uint256,uint256)",
  "function swapAForB(uint256)",
  "function swapBForA(uint256)",
  "function getPrice(address) view returns (uint256)"
];

class DexService {
  constructor() {
    this.provider = null;
    this.signer = null;
  }

  async init() {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('请安装 MetaMask');
      }

      // 请求用户授权
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // 创建 provider 和 signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      return true;
    } catch (error) {
      console.error('初始化 DEX 服务失败:', error);
      return false;
    }
  }

  // 获取代币合约实例
  getTokenContract(tokenAddress) {
    if (!this.signer) {
      throw new Error('请先连接钱包');
    }
    return new ethers.Contract(tokenAddress, TOKEN_ABI, this.signer);
  }

  // 获取工厂合约实例
  getFactoryContract() {
    if (!this.signer) {
      throw new Error('请先连接钱包');
    }
    return new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.signer);
  }

  // 获取交易对合约实例
  getPairContract(pairAddress) {
    if (!this.signer) {
      throw new Error('请先连接钱包');
    }
    return new ethers.Contract(pairAddress, PAIR_ABI, this.signer);
  }

  // 获取代币余额
  async getTokenBalance(tokenAddress, account) {
    if (!this.provider) {
      throw new Error('请先连接钱包');
    }
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.provider);
    return await tokenContract.balanceOf(account);
  }

  // 获取代币信息
  async getTokenInfo(tokenAddress) {
    if (!this.provider) {
      throw new Error('请先连接钱包');
    }
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.provider);
    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals()
    ]);
    return { name, symbol, decimals };
  }

  // 获取交易对信息
  async getPairInfo(tokenA, tokenB) {
    if (!this.provider) {
      throw new Error('请先连接钱包');
    }
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.provider);
    const pairAddress = await factory.pairs(tokenA, tokenB);
    if (pairAddress === ethers.ZeroAddress) {
      throw new Error('交易对不存在');
    }
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);
    const [reserveA, reserveB] = await Promise.all([
      pair.reserveA(),
      pair.reserveB()
    ]);
    return {
      pairAddress,
      reserveA,
      reserveB
    };
  }

  // 添加流动性
  async addLiquidity(tokenA, tokenB, amount0, amount1) {
    if (!this.signer) {
      throw new Error('请先连接钱包');
    }

    try {
      // 获取交易对地址
      const factory = this.getFactoryContract();
      const pairAddress = await factory.pairs(tokenA, tokenB);

      if (pairAddress === ethers.ZeroAddress) {
        throw new Error('交易对不存在');
      }

      // 获取代币合约
      const token0Contract = this.getTokenContract(tokenA);
      const token1Contract = this.getTokenContract(tokenB);

      // 授权代币
      const approveTx0 = await token0Contract.approve(pairAddress, amount0);
      await approveTx0.wait();

      const approveTx1 = await token1Contract.approve(pairAddress, amount1);
      await approveTx1.wait();

      // 添加流动性
      const pairContract = this.getPairContract(pairAddress);
      const tx = await pairContract.addLiquidity(amount0, amount1);
      await tx.wait();

      return tx;
    } catch (error) {
      console.error('添加流动性失败:', error);
      throw new Error('添加流动性失败: ' + error.message);
    }
  }

  // 计算输出金额
  async getAmountOut(amountIn, reserveIn, reserveOut) {
    if (!this.provider) {
      throw new Error('请先连接钱包');
    }
    const pair = new ethers.Contract(PAIR_AB_ADDRESS, PAIR_ABI, this.provider);
    return await pair.getAmountOut(amountIn, reserveIn, reserveOut);
  }

  // 计算输入金额
  async getAmountIn(amountOut, reserveIn, reserveOut) {
    if (!this.provider) {
      throw new Error('请先连接钱包');
    }
    const pair = new ethers.Contract(PAIR_AB_ADDRESS, PAIR_ABI, this.provider);
    return await pair.getAmountIn(amountOut, reserveIn, reserveOut);
  }
}

export const dexService = new DexService(); 