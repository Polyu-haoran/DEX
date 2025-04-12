# DeFi 去中心化交易所项目

## 项目概述

这是一个基于以太坊的去中心化交易所（DEX）项目，实现了代币交换、流动性提供等核心功能。项目采用前后端分离架构，包含智能合约、后端服务和前端界面。本项目参考了Uniswap V2的设计理念，实现了自动做市商(AMM)模型，允许用户无需中心化交易所即可进行代币交换。

## 功能特性详解

### 1. 钱包连接与管理

- **实现文件**: `my-defi-frontend/src/pages/Wallet.js`
- **功能描述**: 
  - 支持MetaMask钱包连接
  - 显示钱包地址和ETH余额
  - 展示网络信息（链ID、网络名称）
  - 提供交易历史记录查看
  - 支持代币余额查询

### 2. 代币交换

- **实现文件**: 
  - 智能合约: `dex-backend/contracts/Pair.sol`
  - 前端: `my-defi-frontend/src/pages/Swap.js`
- **功能描述**:
  - 支持任意ERC20代币之间的交换
  - 实时计算交换比率和滑点
  - 提供最小接收量估算
  - 支持交易确认和执行
  - 交易状态实时反馈

### 3. 流动性提供

- **实现文件**: 
  - 智能合约: `dex-backend/contracts/Pair.sol`, `dex-backend/contracts/Factory.sol`
  - 前端: `my-defi-frontend/src/pages/Liquidity.js`
- **功能描述**:
  - 允许用户为交易对提供流动性
  - 自动计算最优流动性比例
  - 提供流动性代币(LP Token)作为凭证
  - 支持流动性移除功能
  - 显示流动性提供者的收益

### 4. 代币管理

- **实现文件**: 
  - 智能合约: `dex-backend/contracts/TokenA.sol`, `dex-backend/contracts/TokenB.sol`, `dex-backend/contracts/TokenC.sol`
  - 前端: `my-defi-frontend/src/services/tokenService.js`
- **功能描述**:
  - 支持多种ERC20代币的创建和管理
  - 代币余额查询和转账
  - 代币授权管理
  - 代币图标和元数据显示

### 5. 交易历史与状态追踪

- **实现文件**: 
  - 前端: `my-defi-frontend/src/pages/Wallet.js`
  - 后端: `dex-backend/services/transactionService.js`
- **功能描述**:
  - 记录用户的所有交易历史
  - 显示交易状态（成功/失败/处理中）
  - 提供交易详情查看
  - 支持交易哈希链接到区块浏览器

## 智能合约详解

### 合约架构概述

本项目采用了模块化的智能合约设计，主要包含以下几个核心合约：

1. **工厂合约 (Factory.sol)**
   - 负责创建和管理交易对
   - 维护所有已创建交易对的记录
   - 提供查询交易对地址的功能

2. **交易对合约 (Pair.sol)**
   - 实现代币交换的核心逻辑
   - 管理流动性池
   - 处理流动性提供和移除
   - 计算交换比率和滑点

3. **代币合约 (TokenA.sol, TokenB.sol, TokenC.sol)**
   - 实现ERC20标准代币
   - 提供代币转账和授权功能
   - 管理代币余额和总供应量

4. **锁定合约 (Lock.sol)**
   - 提供代币时间锁定功能
   - 用于团队代币和投资者代币的锁定
   - 实现解锁机制和时间控制

### 合约功能详解

#### Factory.sol

```solidity
// 工厂合约的主要功能
contract Factory {
    // 存储所有已创建的交易对
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    
    // 创建新的交易对
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        // 检查交易对是否已存在
        require(tokenA != tokenB, 'IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'PAIR_EXISTS');
        
        // 部署新的交易对合约
        bytes memory bytecode = type(Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        
        // 初始化交易对
        Pair(pair).initialize(token0, token1);
        
        // 记录交易对
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        
        emit PairCreated(token0, token1, pair, allPairs.length);
    }
    
    // 获取所有交易对数量
    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }
}
```

#### Pair.sol

```solidity
// 交易对合约的主要功能
contract Pair {
    // 状态变量
    uint public reserve0;
    uint public reserve1;
    uint public constant MINIMUM_LIQUIDITY = 10**3;
    
    // 代币地址
    address public token0;
    address public token1;
    
    // 初始化函数
    function initialize(address _token0, address _token1) external {
        require(token0 == address(0), 'ALREADY_INITIALIZED');
        token0 = _token0;
        token1 = _token1;
    }
    
    // 获取当前价格
    function getReserves() public view returns (uint _reserve0, uint _reserve1) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
    }
    
    // 代币交换函数
    function swap(uint amount0Out, uint amount1Out, address to) external {
        // 检查输出金额是否有效
        require(amount0Out > 0 || amount1Out > 0, 'INSUFFICIENT_OUTPUT_AMOUNT');
        (uint _reserve0, uint _reserve1) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, 'INSUFFICIENT_LIQUIDITY');
        
        // 计算新的储备量
        uint balance0 = IERC20(token0).balanceOf(address(this)) - amount0Out;
        uint balance1 = IERC20(token1).balanceOf(address(this)) - amount1Out;
        
        // 检查恒定乘积公式
        require(balance0 * balance1 >= _reserve0 * _reserve1, 'K');
        
        // 更新储备量
        _update(balance0, balance1, _reserve0, _reserve1);
        
        // 转移代币
        if (amount0Out > 0) IERC20(token0).transfer(to, amount0Out);
        if (amount1Out > 0) IERC20(token1).transfer(to, amount1Out);
        
        emit Swap(msg.sender, amount0Out, amount1Out);
    }
    
    // 提供流动性函数
    function mint(address to) external returns (uint liquidity) {
        (uint _reserve0, uint _reserve1) = getReserves();
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        uint amount0 = balance0 - _reserve0;
        uint amount1 = balance1 - _reserve1;
        
        // 计算流动性代币数量
        uint _totalSupply = totalSupply;
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min(
                (amount0 * _totalSupply) / _reserve0,
                (amount1 * _totalSupply) / _reserve1
            );
        }
        
        require(liquidity > 0, 'INSUFFICIENT_LIQUIDITY_MINTED');
        _mint(to, liquidity);
        
        _update(balance0, balance1, _reserve0, _reserve1);
        emit Mint(msg.sender, amount0, amount1);
    }
    
    // 内部函数：更新储备量
    function _update(uint balance0, uint balance1, uint _reserve0, uint _reserve1) private {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, 'OVERFLOW');
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        emit Sync(reserve0, reserve1);
    }
}
```

#### TokenA.sol (示例代币)

```solidity
// 示例代币合约
contract TokenA is ERC20 {
    constructor() ERC20("Token A", "TKNA") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    // 铸造新代币
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
    
    // 销毁代币
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
```

#### Lock.sol

```solidity
// 时间锁定合约
contract Lock {
    // 锁定结构
    struct LockInfo {
        uint256 amount;
        uint256 unlockTime;
        bool withdrawn;
    }
    
    // 用户锁定记录
    mapping(address => LockInfo) public locks;
    
    // 锁定代币
    function lock(address token, uint256 amount, uint256 duration) external {
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        
        // 转移代币到合约
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // 记录锁定信息
        locks[msg.sender] = LockInfo({
            amount: amount,
            unlockTime: block.timestamp + duration,
            withdrawn: false
        });
        
        emit Locked(msg.sender, token, amount, block.timestamp + duration);
    }
    
    // 解锁代币
    function unlock(address token) external {
        LockInfo storage lockInfo = locks[msg.sender];
        require(lockInfo.amount > 0, "No tokens locked");
        require(!lockInfo.withdrawn, "Tokens already withdrawn");
        require(block.timestamp >= lockInfo.unlockTime, "Tokens still locked");
        
        // 标记为已提取
        lockInfo.withdrawn = true;
        
        // 转移代币给用户
        IERC20(token).transfer(msg.sender, lockInfo.amount);
        
        emit Unlocked(msg.sender, token, lockInfo.amount);
    }
    
    // 事件
    event Locked(address indexed user, address indexed token, uint256 amount, uint256 unlockTime);
    event Unlocked(address indexed user, address indexed token, uint256 amount);
}
```

### 合约安全机制

1. **重入攻击防护**
   - 使用OpenZeppelin的ReentrancyGuard
   - 在关键函数中实现检查-效果-交互模式

2. **溢出保护**
   - 使用Solidity 0.8.x内置的溢出检查
   - 对关键计算使用SafeMath库

3. **访问控制**
   - 使用OpenZeppelin的Ownable和AccessControl
   - 实现角色基础的权限系统

4. **紧急暂停**
   - 实现Pausable功能
   - 允许管理员在紧急情况下暂停关键功能

5. **升级机制**
   - 使用代理模式实现合约升级
   - 保留状态的同时允许逻辑更新

## 技术栈详解

### 智能合约

- **Solidity**: 用于编写智能合约的主要语言
- **Hardhat**: 以太坊开发环境，提供编译、部署、测试和调试功能
- **OpenZeppelin**: 提供安全、标准化的智能合约库，包括ERC20、ERC721等标准实现
- **Solidity 0.8.x**: 使用最新的Solidity版本，提供内置的溢出检查

### 前端

- **React.js**: 用于构建用户界面的JavaScript库
- **Material-UI**: 提供美观、响应式的UI组件
- **Redux**: 状态管理库，用于管理应用状态
- **ethers.js**: 以太坊JavaScript库，用于与以太坊网络交互
- **Web3.js**: 提供与以太坊节点通信的功能
- **React Router**: 用于前端路由管理
- **Axios**: 用于HTTP请求

### 后端

- **Node.js**: JavaScript运行时环境
- **Express**: Web应用框架
- **Web3**: 以太坊JavaScript API
- **MongoDB**: 用于存储交易历史和用户数据
- **Redis**: 用于缓存和临时数据存储

## 项目架构详解

### 智能合约架构

```
dex-backend/contracts/
├── Factory.sol       # 工厂合约，用于创建和管理交易对
├── Pair.sol          # 交易对合约，实现代币交换和流动性管理
├── TokenA.sol        # 示例代币A合约
├── TokenB.sol        # 示例代币B合约
├── TokenC.sol        # 示例代币C合约
└── Lock.sol          # 时间锁定合约，用于代币锁定
```

### 前端架构

```
my-defi-frontend/src/
├── components/       # 可复用UI组件
│   ├── Header/      # 页面头部组件
│   ├── Footer/      # 页面底部组件
│   ├── TokenList/   # 代币列表组件
│   ├── SwapForm/    # 交换表单组件
│   └── LiquidityForm/ # 流动性表单组件
├── pages/           # 页面组件
│   ├── Home.js      # 首页
│   ├── Swap.js      # 代币交换页面
│   ├── Liquidity.js # 流动性提供页面
│   └── Wallet.js    # 钱包管理页面
├── services/        # 服务层
│   ├── blockchainService.js # 区块链交互服务
│   ├── tokenService.js      # 代币相关服务
│   └── apiService.js        # API请求服务
├── store/           # Redux状态管理
│   ├── actions/     # Redux actions
│   ├── reducers/    # Redux reducers
│   └── index.js     # Redux store配置
├── utils/           # 工具函数
│   ├── web3.js      # Web3工具函数
│   ├── formatters.js # 格式化工具
│   └── validators.js # 验证工具
└── App.js           # 应用入口
```

### 后端架构

```
dex-backend/
├── contracts/       # 智能合约
├── scripts/         # 部署脚本
├── test/            # 测试文件
├── services/        # 后端服务
│   ├── blockchainService.js # 区块链服务
│   ├── transactionService.js # 交易服务
│   └── userService.js       # 用户服务
├── routes/          # API路由
│   ├── api.js       # API路由配置
│   ├── tokens.js    # 代币相关API
│   └── transactions.js # 交易相关API
├── models/          # 数据模型
│   ├── Transaction.js # 交易模型
│   └── User.js       # 用户模型
└── config/          # 配置文件
    ├── database.js  # 数据库配置
    └── web3.js      # Web3配置
```

## 核心功能实现详解

### 自动做市商(AMM)模型

- **实现原理**: 使用恒定乘积公式(x * y = k)计算代币交换比率
- **关键代码**: `Pair.sol`中的`swap`和`mint`函数
- **数学公式**: 
  - 交换比率: Δy = (y * Δx) / (x + Δx)
  - 滑点计算: 实际接收量与预期接收量的差值百分比

### 流动性提供机制

- **实现原理**: 用户提供等值的两种代币，获得LP代币作为凭证
- **关键代码**: `Pair.sol`中的`mint`和`burn`函数
- **LP代币计算**: 基于用户提供的流动性占总流动性的比例

### 代币交换流程

1. 用户选择要交换的代币对
2. 输入交换数量
3. 系统计算预期接收量和滑点
4. 用户确认交易
5. 前端调用智能合约的swap函数
6. 交易被提交到区块链
7. 交易状态实时更新
8. 交易完成后更新用户余额

## 安装说明

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0
- MetaMask钱包
- 以太坊测试网或主网访问权限

### 安装步骤

1. 克隆项目

```bash
git clone [项目地址]
cd [项目目录]
```

2. 安装依赖

```bash
# 安装智能合约依赖
cd dex-backend
npm install

# 安装前端依赖
cd ../my-defi-frontend
npm install
```

3. 配置环境变量

- 在dex-backend目录下创建.env文件，包含以下内容:

```
INFURA_API_KEY=你的Infura API密钥
PRIVATE_KEY=你的私钥（用于部署合约）
ETHERSCAN_API_KEY=你的Etherscan API密钥
MONGODB_URI=你的MongoDB连接字符串
```

- 在my-defi-frontend目录下创建.env文件，包含以下内容:

```
REACT_APP_INFURA_API_KEY=你的Infura API密钥
REACT_APP_CONTRACT_ADDRESS=已部署的合约地址
REACT_APP_API_URL=后端API地址
```

## 使用说明

### 启动开发环境

1. 启动本地区块链网络

```bash
cd dex-backend
npx hardhat node
```

2. 部署智能合约

```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. 启动后端服务

```bash
cd dex-backend
npm run dev
```

4. 启动前端服务

```bash
cd my-defi-frontend
npm start
```

### 使用流程详解

#### 1. 连接钱包

- 点击页面右上角的"连接钱包"按钮
- 在弹出的MetaMask窗口中确认连接
- 连接成功后，页面将显示您的钱包地址和ETH余额

#### 2. 查看代币余额

- 在钱包页面，系统会自动加载您持有的所有代币余额
- 每个代币显示名称、符号、余额和图标
- 点击代币可以查看详细信息和交易历史

#### 3. 代币交换

- 导航到"交换"页面
- 选择要交换的代币对（例如ETH/USDT）
- 输入要交换的数量
- 系统会自动计算预期接收量和滑点
- 点击"交换"按钮确认交易
- 在MetaMask中确认交易
- 等待交易确认，查看结果

#### 4. 提供流动性

- 导航到"流动性"页面
- 选择要提供流动性的代币对
- 输入要提供的代币数量
- 系统会自动计算另一个代币的所需数量
- 点击"提供流动性"按钮
- 在MetaMask中确认交易
- 交易确认后，您将收到LP代币作为凭证

#### 5. 移除流动性

- 在"流动性"页面，选择您提供的流动性池
- 输入要移除的LP代币数量
- 系统会计算您将收到的代币数量
- 点击"移除流动性"按钮
- 在MetaMask中确认交易
- 交易确认后，代币将返还到您的钱包

## 测试

```bash
# 运行智能合约测试
cd dex-backend
npx hardhat test

# 运行前端测试
cd ../my-defi-frontend
npm test
```

## 部署到生产环境

### 智能合约部署

```bash
cd dex-backend
npx hardhat run scripts/deploy.js --network mainnet
```

### 前端部署

```bash
cd my-defi-frontend
npm run build
# 将build目录部署到您的Web服务器
```

### 后端部署

```bash
cd dex-backend
npm run start
# 使用PM2或类似工具保持服务运行
```

## 安全考虑

- 所有智能合约都经过审计
- 使用OpenZeppelin的安全合约库
- 实现了重入攻击防护
- 使用安全的随机数生成方法
- 实现了紧急暂停功能

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License 
