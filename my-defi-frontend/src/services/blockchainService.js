import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../config/contracts';

// 网络名称映射
const NETWORK_NAMES = {
  '1': 'Ethereum Mainnet',
  '5': 'Goerli Testnet',
  '11155111': 'Sepolia Testnet',
  '31337': 'Hardhat Local',
  '80001': 'Mumbai Testnet',
  '137': 'Polygon Mainnet'
};

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.networkNameMap = {
      '1': 'Ethereum Mainnet',
      '5': 'Goerli Testnet',
      '31337': 'Hardhat Local'
    };
  }

  // 初始化以太坊提供者
  async init() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // 请求用户授权
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // 创建 provider 和 signer
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();

        // 监听账户变化
        window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
        window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

        return true;
      } catch (error) {
        console.error('初始化区块链服务失败:', error);
        return false;
      }
    }
    return false;
  }

  // 获取当前账户
  async getAccount() {
    if (!this.signer) return null;
    try {
      return await this.signer.getAddress();
    } catch (error) {
      console.error('获取账户失败:', error);
      return null;
    }
  }

  // 获取账户余额
  async getBalance(address) {
    if (!this.provider) {
      throw new Error('请先连接钱包');
    }
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('获取余额失败:', error);
      return '0';
    }
  }

  // 获取网络信息
  async getNetwork() {
    if (!this.provider) return null;
    try {
      const network = await this.provider.getNetwork();
      return {
        ...network,
        name: this.networkNameMap[network.chainId.toString()] || 'unknown'
      };
    } catch (error) {
      console.error('获取网络信息失败:', error);
      return null;
    }
  }

  // 监听账户变化
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // 用户断开了钱包连接
      this.signer = null;
      window.location.reload();
    } else {
      // 账户已更改，刷新页面
      window.location.reload();
    }
  }

  // 监听网络变化
  handleChainChanged() {
    // 链已更改，刷新页面
    window.location.reload();
  }

  // 断开与 MetaMask 的连接
  async disconnect() {
    try {
      if (window.ethereum) {
        // 移除所有事件监听器
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');

        // 重置 provider 和 signer
        this.provider = null;
        this.signer = null;

        return true;
      }
      return false;
    } catch (error) {
      console.error('断开连接失败:', error);
      return false;
    }
  }

  async switchNetwork() {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
      return true;
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error('添加网络失败:', addError);
          return false;
        }
      }
      console.error('切换网络失败:', error);
      return false;
    }
  }
}

export const blockchainService = new BlockchainService();
