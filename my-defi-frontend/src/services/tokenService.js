import { ethers } from 'ethers';
import { blockchainService } from './blockchainService';
import { dexService } from './dexService';

// 导入合约地址
const {
  TOKEN_A_ADDRESS,
  TOKEN_B_ADDRESS,
  TOKEN_C_ADDRESS
} = require('../config/contracts');

class TokenService {
  constructor() {
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = null;
    this.init();
  }

  async init() {
    try {
      this.signer = await this.provider.getSigner();
    } catch (error) {
      console.error('初始化 Token 服务失败:', error);
    }
  }

  // 获取所有代币信息
  async getAllTokenInfo() {
    const tokens = [
      { address: TOKEN_A_ADDRESS, name: 'Token A', symbol: 'TKA' },
      { address: TOKEN_B_ADDRESS, name: 'Token B', symbol: 'TKB' },
      { address: TOKEN_C_ADDRESS, name: 'Token C', symbol: 'TKC' }
    ];

    const tokenInfos = await Promise.all(
      tokens.map(async (token) => {
        const info = await dexService.getTokenInfo(token.address);
        return {
          ...token,
          ...info
        };
      })
    );

    return tokenInfos;
  }

  // 获取用户所有代币余额
  async getUserTokenBalances(account) {
    const tokens = [TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, TOKEN_C_ADDRESS];
    const balances = await Promise.all(
      tokens.map(address => dexService.getTokenBalance(address, account))
    );

    return {
      [TOKEN_A_ADDRESS]: balances[0],
      [TOKEN_B_ADDRESS]: balances[1],
      [TOKEN_C_ADDRESS]: balances[2]
    };
  }

  // 格式化代币金额
  formatTokenAmount(amount, decimals) {
    return ethers.formatUnits(amount, decimals);
  }

  // 解析代币金额
  parseTokenAmount(amount, decimals) {
    return ethers.parseUnits(amount, decimals);
  }

  // 获取代币图标
  getTokenIcon(symbol) {
    // 这里可以添加代币图标逻辑
    return `/tokens/${symbol.toLowerCase()}.png`;
  }
}

export const tokenService = new TokenService(); 