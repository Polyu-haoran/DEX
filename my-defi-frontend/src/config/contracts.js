// 代币合约地址
export const TOKEN_A_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const TOKEN_B_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const TOKEN_C_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// 交易对合约地址
export const PAIR_AB_ADDRESS = "0x3B02fF1e626Ed7a8fd6eC5299e2C54e1421B626B";
export const PAIR_AC_ADDRESS = "0xBA12646CC07ADBe43F8bD25D83FB628D29C8A762";
export const PAIR_BC_ADDRESS = "0x7ab4C4804197531f7ed6A6bc0f0781f706ff7953";

// Factory 合约地址
export const FACTORY_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

// 网络配置
export const NETWORK_CONFIG = {
  chainId: '0x7A69', // 31337 in hex
  chainName: 'Hardhat Local',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: null
}; 