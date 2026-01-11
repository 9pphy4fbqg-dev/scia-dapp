# SCIADapp项目索引文件

## 1. 项目概述

### 1.1 项目名称
SCIADapp - 基于区块链的私募和推荐奖励DAPP

### 1.2 项目目标
实现一个完整的区块链DAPP，支持私募购买、推荐奖励、积分系统和徽章等级，为用户提供安全、高效的代币购买和推荐体验。

### 1.3 核心功能
- 私募代币购买（支持USDT支付）
- 推荐奖励系统（无限代积分传递）
- 积分系统（直接使用USDT金额作为积分值，1 USDT = 1积分，测试网参数缩小10000倍）
- 徽章等级系统（会员、市级、省级、国家级）
- 分红机制（根据徽章等级分配收益）

## 2. 目录结构

```
SCIA/
├── backend/              # 后端服务器目录
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # API路由
│   ├── uploads/         # 上传文件存储
│   ├── index.js         # 服务器入口
│   └── package.json     # 依赖配置
├── contracts/             # 智能合约目录（已部署测试网，合约间测试完成）
│   ├── core/            # 核心合约（预留）
│   └── modules/         # 功能模块合约
│       ├── PrivateSaleContract.sol  # 私募合约（已部署）
│       └── ReferralCenter.sol       # 推荐中心合约（已部署）
├── dist/                 # 构建输出目录
│   └── assets/          # 静态资源
│       ├── logo/        # LOGO资源
│       └── splash/      # 开屏动画资源
├── project_index.md      # 项目索引文件（本文件）
```

## 3. 项目配置

### 3.1 环境变量配置

```
# 网络配置
REACT_APP_NETWORK=testnet # mainnet or testnet

# 主网配置
REACT_APP_MAINNET_CHAIN_ID=56
REACT_APP_MAINNET_RPC_URL=https://bsc-dataseed.binance.org/
REACT_APP_MAINNET_BSC_SCAN_URL=https://bscscan.com/

# 测试网配置
REACT_APP_TESTNET_CHAIN_ID=97
REACT_APP_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
REACT_APP_TESTNET_BSC_SCAN_URL=https://testnet.bscscan.com/

# 主网合约地址
REACT_APP_MAINNET_SANCIA_TOKEN_ADDRESS=0x5d2F1E17C256E7115BC4d0E3F079f6F043B46e00
REACT_APP_MAINNET_REFERRAL_CENTER_ADDRESS=0x6425190a47A8A6CF98de90a7A194A80bdf8b023f
REACT_APP_MAINNET_PRIVATE_SALE_CONTRACT_ADDRESS=0x2D311407538ae1CacdCb234A2c7170579ee4E349
REACT_APP_MAINNET_USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955

# 测试网合约地址
REACT_APP_TESTNET_SANCIA_TOKEN_ADDRESS=0xCc528eb49547C258D08f80b77823Ee54D043Ee1C
REACT_APP_TESTNET_REFERRAL_CENTER_ADDRESS=0x75a6858B136012187F68B9E06Ee048c25b815aB4
REACT_APP_TESTNET_PRIVATE_SALE_CONTRACT_ADDRESS=0xf5753871068D76CFdb8f2c20b8cd0E6be5C9BC46
REACT_APP_TESTNET_USDT_ADDRESS=0x337610d27c682E347C9cD60BD4b3b107C9d34dDd

# 部署者信息
REACT_APP_DEPLOYER_ADDRESS=0x77D8b5F8a03cB7A7F5eED8D979750650F924d709

# BSCScan API密钥
REACT_APP_BSCSCAN_API_KEY=RW6NUTIX67H7C8K14PCEJ22TSRVN8FGDDQ
```

## 4. DAPP设计与功能

### 4.1 核心设计原则
- DAPP内部不负责任何计算，只调用合约以及链上数据
- 主网DAPP建立数据库用于储存用户注册信息
- 支持钱包连接作为身份验证方式

### 4.2 用户注册系统

#### 4.2.1 注册流程
- 用户点击"连接钱包"，完成钱包连接
- 已注册用户直接进入个人中心页面
- 未注册用户弹出注册页面，要求用户注册
- 未注册用户可浏览所有页面，但无法使用功能
- 点击任何功能按钮时，友好引导用户注册

#### 4.2.2 注册信息
- 自定义头像上传功能
- 用户名输入功能（支持中文、英文、数字、符号）
- 注册信息保存到服务器
- 每7天允许用户修改一次用户名和头像

### 4.3 个人中心页面

#### 4.3.1 公开组件
1. **用户基本信息组件**
   - 展示用户头像、用户名
   - 徽章图片及升级到下一等级所需积分
   - 钱包地址
   - USDT余额、SCIA代币余额
   - 推荐人（显示注册名，不显示钱包地址）
   - 注册时间

2. **推广信息组件**
   - 个人专属推广链接及二维码
   - 直接推荐显示最近5人，包含每个人的购买金额
   - 获得的总积分
   - 获得的总奖励（包含SCIA奖励和USDT奖励）
   - 查询所有推荐树按钮（调用合约接口展示所有推荐关系）

#### 4.3.2 隐藏组件（仅合约所有者可见）
- 合约管理按钮
- DAPP管理按钮
- 链上统计按钮

### 4.4 私募页面

#### 4.4.1 核心组件
- 私募信息展示
- 购买份数选择器
- 购买按钮
- 预估金额和代币数量同步展示
- 不展示销售状态和池子信息

### 4.5 导航配置

#### 4.5.1 顶部导航
- 包含Sancta品牌标识
- 连接钱包按钮

#### 4.5.2 底部导航
- 私募
- 数据
- 社区
- 商城
- NFT
- 我
- 统计

#### 4.5.3 页面配置
- 私募页面：已配置，可正常使用
- 个人中心页面：已配置，可正常使用
- 数据、社区、商城、NFT、统计页面：
  - 可正常跳转
  - 跳转后显示"该功能正在开发中"

### 4.6 功能集成
- **当前工作重点**：DAPP与合约以及钱包之间的功能集成，用户注册系统前端实现
- **合约状态**：所有合约已部署到测试网，合约间测试全部完成
- **静态资源**：已准备就绪，包含LOGO和开屏动画资源
- **项目结构**：已按照设计文档创建完整的前端项目结构
- **依赖安装**：已安装所有必要依赖，包括React 18、TypeScript、Vite 5、Redux Toolkit、RTK Query、RainbowKit 2、Wagmi 2、Ant Design 5、Viem等
- **页面配置**：已完成基础页面和路由配置，包括私募页面、个人中心页面、数据页面、社区页面、商城页面、NFT页面、统计页面
- **已实现功能**：
  - ✅ 钱包连接功能：使用RainbowKit和Wagmi实现
  - ✅ 私募购买功能：完整实现，包括USDT余额检查、授权处理、交易状态管理和错误处理
  - ✅ 后端API：完整实现用户管理API，包括注册、登录、获取用户信息、更新用户信息等
  - ✅ 用户注册系统：完整实现前后端集成，包括头像上传（支持多种格式，最大10MB）、用户名设置
  - ✅ 导航系统：修复导航嵌套问题，确保页面布局正确
  - ✅ 钱包状态同步：确保组件间钱包连接状态同步
  - ✅ 注册状态自动刷新：注册成功后自动更新用户状态
  - ✅ 购买按钮响应：修复购买按钮不响应问题
  - ✅ 个人中心数据展示：基础信息、徽章和积分展示
  - ✅ 徽章和积分展示：从合约获取徽章等级和积分信息，显示当前徽章和升级所需剩余积分
  - ✅ USDT余额和授权查询：实时查询用户USDT余额和授权额度
  - ✅ SCIA余额查询：从合约获取实际的SCIA余额
  - ✅ 推荐系统完整功能：
    - ✅ 推荐人信息展示：显示用户的推荐人信息（只显示用户名）
    - ✅ 直接推荐列表：展示最近5个直接推荐，只显示用户名
    - ✅ 推荐树查询：实现完整推荐关系查询，支持所有推荐深度，只显示用户名
    - ✅ 推荐关系注册：自动处理URL中的推荐人参数，注册推荐关系
    - ✅ 分红领取功能：显示可领取分红，支持按徽章等级领取
    - ✅ 总奖励展示：从后端API获取总SCIA和USDT奖励，每30秒自动刷新
      - **后端实现**：
        - 用户模型添加`totalRewards`字段（包含`scia`和`usdt`子字段，存储为wei值字符串）
        - 添加`PUT /api/users/:walletAddress/rewards`端点用于更新奖励
        - 使用BigInt处理大数运算，确保奖励累加的准确性
      - **前端实现**：
        - 实现定时刷新机制，每30秒调用一次API
        - 使用`fetch`获取用户总奖励数据，并更新UI显示
        - 移除未使用的导入，优化代码性能
    - ✅ 链上事件监听：监听`ReferralRewardDistributed`事件，实时更新奖励数据
      - 前端使用Wagmi 2.0的`useWatchContractEvent`钩子监听链上事件
      - 事件触发时自动调用后端API更新奖励数据
      - 更新完成后刷新总奖励和奖励明细
    - ✅ 奖励明细展示：
      - **后端实现**：
        - 新增`RewardDetail`模型，存储每笔奖励详情
        - 添加`GET /api/users/:walletAddress/reward-details`端点，支持分页和过滤
        - 记录奖励类型、金额、来源、交易哈希等信息
      - **前端实现**：
        - 实现奖励明细表格展示，支持分页
        - 显示奖励类型、金额、来源、相关地址、交易哈希和时间
        - 添加刷新按钮，支持手动刷新数据
        - 使用Tabs组件区分"推广信息"和"奖励明细"
  - ✅ 交易状态管理：显示交易提交状态、等待确认状态和交易结果
  - ✅ 错误处理机制：处理钱包连接错误、余额不足、授权不足、合约暂停或结束、网络错误、交易被拒绝、合约拒绝等常见错误
  - ✅ 用户体验优化：实时显示余额和授权状态、预估金额和代币数量自动更新、友好的错误提示、购买按钮状态根据条件动态变化、交易结果清晰展示
- **当前项目状态**：
  - 个人中心页面已实现完整功能，包括推荐系统、分红领取、SCIA余额查询等
  - 推荐系统功能已完整实现，直接从合约获取数据
  - 徽章和积分展示已实现，计算逻辑与合约一致
  - 积分系统和徽章升级功能已确认正常，包括：
    - 徽章等级展示正确
    - 升级所需剩余积分计算准确
    - 积分值显示与合约一致
    - 徽章升级逻辑正常
- **待完善功能**：
  - 推荐树节点信息：推荐树节点目前只显示用户名，没有显示购买金额等更详细的信息
  - 前端未使用到的合约函数：
    - `setPrivateSaleContract` - 设置私募合约地址（管理员功能）
    - `freezeBadges` - 冻结徽章（管理员功能）
    - `fundBadgePool` - 为徽章池注入资金（管理员功能）
    - `getBadgeCount` - 获取徽章数量
    - `hasReferrerEligibility` - 检查推荐人资格
  - 管理员功能：前端没有实现相关的UI组件
  - 事件监听：前端没有监听所有合约事件（如徽章获得、积分更新等），无法实时更新所有数据
  - 分红周期显示：前端没有显示当前分红周期的开始和结束时间

- **已实现功能补充**：
  - ✅ 更换头像功能：完整实现，支持图片选择、预览、上传和错误处理，限制10MB大小，仅支持图片文件
  - ✅ 复制链接功能：完整实现，使用navigator.clipboard API，支持成功/失败提示
  - ✅ 推广二维码生成：完整实现，使用qrcode.react库生成二维码，支持下载真实的SVG文件
- **建议的下一步工作**：
  - 优化用户体验和界面设计
  - 添加更多功能模块（数据、社区、商城等）
  - 添加交易历史记录功能
  - 完善分红发放机制的前端展示
  - 实现完整的测试用例
  - 优化合约交互性能
  - 添加更多的错误处理和异常情况处理
  - 实现响应式设计，适配移动端设备

## 5. 功能模块

### 5.1 私募合约（PrivateSaleContract）

#### 5.1.1 核心功能
- 双池设计：私募池和奖励池
- 支持USDT支付购买SCIA代币
- 推荐奖励机制
- 自动售罄检测和处理
- 管理员功能（暂停/结束销售、存款、提款等）

#### 5.1.2 关键参数
- 代币价格：0.00001 USDT/SCIA（测试网，实际应为0.1 USDT/SCIA，即10000000000000 wei USDT/SCIA）
- 每包USDT：0.01 USDT（测试网，实际应为100 USDT，即10000000000000000 wei USDT）
- 每包SCIA：1000 SCIA（即1000000000000000000000 wei SCIA）
- 最小购买：1 package
- 最大购买：1000 packages
- 推荐奖励：5% SCIA + 5% USDT（通过REFERRAL_SCIAs_RATE=500和REFERRAL_USDT_RATE=500计算，分母为10000）

#### 5.1.3 主要函数
- `buyTokens(uint256 packages, address referrer)` - 购买代币
- `setSaleStatus(bool _isPaused)` - 设置销售状态
- `endSale()` - 结束销售
- `depositTokens(uint256 privateSaleAmount, uint256 rewardAmount)` - 存入代币
- `autoDistributeTokens()` - 自动分配代币到私募池和奖励池
- `getPoolInfo()` - 获取池信息
- `withdrawUSDT(uint256 amount)` - 提取USDT（仅管理员）
- `emergencyWithdrawTokens(uint256 amount)` - 紧急提取SCIA代币（仅管理员）

### 5.2 前端交易逻辑

#### 5.2.1 核心功能
- USDT余额检查：实时检查用户的USDT余额是否足够购买
- USDT授权处理：自动检查并请求USDT授权
- 交易状态管理：显示交易进度和结果
- 错误处理机制：处理各种交易错误
- 购买流程优化：简化用户购买操作

#### 5.2.2 购买流程
1. **连接钱包**：用户连接钱包，获取钱包地址
2. **检查余额和授权**：
   - 实时查询用户USDT余额
   - 查询USDT授权额度
   - 检查合约状态（是否暂停或结束）
3. **购买份数选择**：用户输入或选择购买份数
4. **预估金额计算**：自动计算预估USDT金额和SCIA代币数量
5. **提交购买请求**：
   - 如果授权不足，自动请求USDT授权
   - 授权成功后，自动执行购买操作
6. **交易状态监控**：
   - 显示交易提交状态
   - 等待交易确认
   - 显示交易结果（成功或失败）
7. **结果反馈**：通过消息提示告知用户交易结果

#### 5.2.3 技术实现
- 使用Wagmi 2.0 hooks进行合约交互
- 使用useContractRead获取余额、授权和合约状态
- 使用useWalletClient发送交易
- 使用useWaitForTransactionReceipt监听交易确认
- 使用Ant Design组件库构建UI
- 使用Redux管理全局状态

#### 5.2.4 关键代码实现
```typescript
// 检查USDT余额是否足够
const isBalanceSufficient = (): boolean => {
  if (!usdtBalance) return true;
  const balance = Number(usdtBalance) / 10 ** 18;
  return balance >= estimatedUSDT;
};

// 检查USDT授权是否足够
const isAllowanceSufficient = (): boolean => {
  if (usdtAllowance === undefined) return true;
  return usdtAllowance >= requiredUSDTWei;
};

// 购买代币方法
const handleBuyTokens = async (packagesToBuy: number, referrer: string) => {
  // 检查钱包客户端
  if (!walletClient) {
    throw new Error('钱包客户端未连接');
  }
  
  // 调用购买方法
  const hash = await walletClient.writeContract({
    abi: privateSaleAbi,
    address: PRIVATE_SALE_ADDRESS,
    functionName: 'buyTokens',
    args: [
      BigInt(packagesToBuy), 
      referrer ? (referrer as `0x${string}`) : '0x0000000000000000000000000000000000000000' as `0x${string}`
    ],
  });
  
  setPurchaseHash(hash);
};
```

#### 5.2.5 错误处理
- **钱包连接错误**：提示用户连接钱包
- **余额不足**：显示余额不足提示
- **授权不足**：自动请求授权
- **合约暂停或结束**：提示销售状态
- **网络错误**：友好的错误提示
- **交易被拒绝**：显示用户拒绝交易提示
- **合约拒绝**：显示合约拒绝原因

#### 5.2.6 用户体验优化
- 实时显示余额和授权状态
- 预估金额和代币数量自动更新
- 交易进度实时反馈
- 友好的错误提示
- 购买按钮状态根据条件动态变化
- 交易结果清晰展示

### 5.3 推荐中心合约（ReferralCenter）

#### 5.3.1 核心功能
- 推荐关系注册（永久绑定）
- 积分系统（无限代传递）
- 徽章等级管理
- 分红发放机制
- 徽章冻结功能
- 推荐人资格检查

#### 5.3.2 徽章系统
- **会员徽章**：0.11 USDT（测试网，实际应为1100 USDT）
- **市级徽章**：0.55 USDT（测试网，实际应为5500 USDT）
- **省级徽章**：2.75 USDT（测试网，实际应为27500 USDT）
- **国家级徽章**：13.75 USDT（测试网，实际应为137500 USDT）

#### 5.3.3 分红机制
- **资金分配**：社区金库转入资金时，通过`fundBadgePool`函数按比例分配到4个徽章池（各25%）
- **分红周期**：每个分红周期为29天23小时30分钟
- **领取规则**：用户只能领取当前持有徽章等级的分红，且每个周期只能领取一次
- **领取方式**：通过`claimDividend`函数手动领取
- **自动过期**：分红过期后无法领取

#### 5.3.4 推荐人资格
- 推荐人必须购买过代币才能拥有推荐资格
- 通过`hasReferrerEligibility`函数检查推荐人资格

#### 5.3.5 徽章冻结
- 私募结束后，通过`freezeBadges`函数冻结徽章状态
- 冻结后无法再获得新徽章
- 已获得的徽章保持不变

#### 5.3.6 主要函数
- `registerReferral(address referrer)` - 注册推荐关系
- `registerReferralFor(address user, address referrer)` - 为指定用户注册推荐关系（允许私募合约调用）
- `updatePoints(address user, uint256 amount)` - 更新积分
- `checkBadgeEligibility(address user)` - 检查徽章资格
- `freezeBadges()` - 冻结徽章（私募结束后调用）
- `setPrivateSaleContract(address _privateSaleContract)` - 设置私募合约地址（仅管理员）
- `fundBadgePool(uint256 amount)` - 社区金库转入资金，自动分配到4个分红池（仅管理员）
- `claimDividend(BadgeLevel badgeLevel)` - 领取分红
- `getEligibleBadgeLevel(uint256 userPoints)` - 根据积分获取用户符合条件的最高徽章等级
- `hasReferrerEligibility(address addr)` - 检查地址是否有推荐人资格（必须购买过代币）
- `getUserBadgeInfo(address user)` - 获取用户徽章信息
- `getNextBadgeThreshold(BadgeLevel currentBadge)` - 获取下一等级徽章需要的积分
- `getBadgeCount(BadgeLevel badgeLevel)` - 获取徽章数量
- `getUserClaimableDividends(address user)` - 获取用户可领取分红

## 6. 技术栈

### 6.1 智能合约
- Solidity ^0.8.19
- OpenZeppelin Contracts（Ownable, ReentrancyGuard, IERC20）

### 6.2 前端（计划）
- React 18
- TypeScript
- Vite 5
- Redux Toolkit
- RTK Query
- RainbowKit 2 + Wagmi 2
- Ant Design 5
- Viem

### 6.3 后端
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT（预留）
- Multer（文件上传）
- Helmet（安全头）
- express-rate-limit（速率限制）
- CORS（跨域支持）

### 6.4 开发工具
- Hardhat（智能合约开发和测试）
- Ethers.js v6（辅助区块链交互）

## 7. 合约接口定义

### 7.1 PrivateSaleContract 接口
```solidity
interface IPrivateSaleContract {
    function buyTokens(uint256 packages, address referrer) external;
    function setSaleStatus(bool _isPaused) external;
    function endSale() external;
    function depositTokens(uint256 privateSaleAmount, uint256 rewardAmount) external;
    function autoDistributeTokens() external;
    function getPoolInfo() external view returns (
        uint256 remainingPrivateSale, 
        uint256 remainingRewardPool,
        uint256 currentPrivateSaleBalance,
        uint256 currentRewardPoolBalance,
        uint256 totalSoldSCIA,
        uint256 totalRewardDistributedSCIA
    );
    function withdrawUSDT(uint256 amount) external;
    function emergencyWithdrawTokens(uint256 amount) external;
    function purchaseAmounts(address user) external view returns (uint256);
}
```

### 7.2 ReferralCenter 接口
```solidity
interface IReferralCenter {
    enum BadgeLevel {
        None,     // 0 - 无徽章
        Member,   // 1 - 会员徽章
        City,     // 2 - 市级徽章
        Province, // 3 - 省级徽章
        National  // 4 - 国级徽章
    }
    
    function registerReferral(address referrer) external;
    function registerReferralFor(address user, address referrer) external;
    function updatePoints(address user, uint256 amount) external;
    function checkBadgeEligibility(address user) external;
    function freezeBadges() external;
    function setPrivateSaleContract(address _privateSaleContract) external;
    function fundBadgePool(uint256 amount) external;
    function claimDividend(BadgeLevel badgeLevel) external;
    function getUserBadgeInfo(address user) external view returns (
        BadgeLevel badgeLevel,
        uint256 userPoints,
        uint256 nextBadgeThreshold
    );
    function getEligibleBadgeLevel(uint256 userPoints) external pure returns (BadgeLevel);
    function hasReferrerEligibility(address addr) external view returns (bool);
    function getNextBadgeThreshold(BadgeLevel currentBadge) external pure returns (uint256);
    function getBadgeCount(BadgeLevel badgeLevel) external view returns (uint256);
    function getUserClaimableDividends(address user) external view returns (uint256);
}
```

## 8. 依赖关系

### 8.1 合约依赖
- PrivateSaleContract 依赖 ReferralCenter 合约
- ReferralCenter 依赖 PrivateSaleContract 合约
- 两者均依赖 OpenZeppelin Contracts

### 8.2 外部依赖
- SCIA代币合约（ERC20）
- USDT代币合约（ERC20）

## 9. 开发流程

### 9.1 智能合约开发
1. 编写合约代码
2. 运行单元测试
3. 部署到测试网
4. 进行测试网测试
5. 部署到主网

### 9.2 前端开发
1. 初始化项目
2. 配置核心库（Redux Toolkit, Wagmi, RainbowKit等）
3. 实现UI组件
4. 集成合约交互
5. 测试和优化
6. 构建和部署

## 10. 关键合约事件

### 10.1 PrivateSaleContract 事件
- `SaleStatusChanged(bool isPaused, bool isEnded)` - 销售状态变更
- `TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 sciaAmount, address referrer)` - 代币购买
- `ReferralRewardDistributed(address indexed referrer, uint256 sciaReward, uint256 usdtReward)` - 推荐奖励分发
- `SaleEnded(uint256 totalSold, uint256 totalRewardDistributed)` - 销售结束

### 10.2 ReferralCenter 事件
- `ReferralRegistered(address indexed user, address indexed referrer)` - 推荐关系注册
- `PointsUpdated(address indexed user, uint256 oldPoints, uint256 newPoints)` - 积分更新
- `BadgeAchieved(address indexed user, BadgeLevel badgeLevel, uint256 timestamp)` - 徽章获得
- `DividendClaimed(address indexed user, uint8 indexed badgeLevel, uint256 amount)` - 分红领取
- `BadgesFrozen()` - 徽章冻结

## 11. 权限管理

### 11.1 合约所有者
- 可暂停/结束销售
- 可存入/提取代币
- 可设置合约地址
- 可冻结徽章

### 11.2 普通用户
- 可购买代币
- 可注册推荐关系
- 可领取分红
- 可查看自己的积分和徽章

## 12. 测试网配置

### 12.1 测试网参数（已缩小10000倍）
- 代币价格：0.00001 USDT/SCIA
- 每包USDT：0.01 USDT
- 每包SCIA：1000 SCIA

### 12.2 徽章阈值（测试网）
- 会员徽章：0.11积分
- 市级徽章：0.55积分
- 省级徽章：2.75积分
- 国家级徽章：13.75积分

## 13. 主网配置（预计）

### 13.1 主网参数
- 代币价格：0.1 USDT/SCIA
- 每包USDT：100 USDT
- 每包SCIA：1000 SCIA

### 13.2 徽章阈值（主网）
- 会员徽章：1100积分
- 市级徽章：5500积分
- 省级徽章：27500积分
- 国家级徽章：137500积分

## 14. 安全考虑

### 14.1 合约安全
- 使用 ReentrancyGuard 防止重入攻击
- 使用 Ownable 管理权限
- 严格的输入验证
- 事件日志完整

### 14.2 前端安全
- 使用安全的钱包连接库（Wagmi + RainbowKit）
- 合约地址从配置文件获取，避免硬编码
- 敏感操作需要用户确认

## 15. 性能优化

### 15.1 合约性能
- 减少不必要的状态变量更新
- 优化循环逻辑（推荐链遍历）
- 使用高效的存储结构

### 15.2 前端性能
- 使用 RTK Query 缓存数据
- 优化组件渲染
- 减少不必要的合约调用

## 16. 监控和维护

### 16.1 合约监控
- 监控合约事件
- 定期检查池余额
- 监控异常交易

### 16.2 前端监控
- 监控页面加载时间
- 监控用户行为
- 监控错误日志

## 17. 后端服务器架构与功能

### 17.1 服务器概述
后端服务器基于Node.js + Express.js开发，采用MongoDB作为数据库，提供用户注册、登录、信息管理等核心功能，同时支持后续功能拓展。

### 17.2 核心功能
- 用户注册与登录
- 个人信息管理（头像、用户名）
- 推荐人关系管理
- 安全的文件上传
- 完善的错误处理和日志记录

### 17.3 目录结构
```
backend/
├── controllers/     # 控制器
│   └── userController.js  # 用户控制器
├── middleware/      # 中间件
│   └── upload.js          # 文件上传中间件
├── models/          # 数据模型
│   └── User.js            # 用户模型
├── routes/          # API路由
│   └── userRoutes.js      # 用户路由
├── uploads/         # 上传文件存储
├── index.js         # 服务器入口
└── package.json     # 依赖配置
```

### 17.4 技术栈
- **运行环境**：Node.js
- **Web框架**：Express.js
- **数据库**：MongoDB + Mongoose
- **认证**：JWT（预留）
- **文件上传**：Multer
- **安全**：Helmet + express-rate-limit + CORS
- **环境配置**：dotenv

### 17.5 API端点

#### 17.5.1 用户管理API

| 方法 | 端点 | 功能 | 访问权限 |
|------|------|------|----------|
| POST | `/api/users/register` | 用户注册 | 公开 |
| POST | `/api/users/login` | 用户登录 | 公开 |
| GET | `/api/users/:walletAddress` | 获取用户信息 | 公开 |
| PUT | `/api/users/:walletAddress` | 更新用户信息（含头像） | 公开 |
| GET | `/api/users` | 获取用户列表（分页） | 管理员 |
| DELETE | `/api/users/:id` | 删除用户 | 管理员 |

#### 17.5.2 系统API

| 方法 | 端点 | 功能 | 访问权限 |
|------|------|------|----------|
| GET | `/api/health` | 健康检查 | 公开 |

### 17.6 数据模型

#### 17.6.1 User模型

| 字段 | 类型 | 描述 | 约束 |
|------|------|------|------|
| walletAddress | String | 钱包地址（唯一标识） | 必填，唯一，小写 |
| username | String | 用户名 | 必填，唯一，最大50字符 |
| avatar | String | 头像URL | 可选，默认空字符串 |
| createdAt | Date | 注册时间 | 默认当前时间 |
| updatedAt | Date | 上次修改时间 | 默认当前时间 |
| lastProfileUpdate | Date | 上次修改用户名和头像的时间 | 默认当前时间 |
| referrerAddress | String | 推荐人地址 | 可选 |
| status | String | 用户状态 | 枚举：active, inactive, banned，默认active |
| role | String | 用户角色 | 枚举：user, admin, superadmin，默认user |
| lastLogin | Date | 最后登录时间 | 默认当前时间 |

**虚拟属性**：
- `registrationDays`：注册天数
- `canUpdateProfile`：是否可以修改个人信息（每7天允许修改一次）

**实例方法**：
- `updateProfile(updates)`：更新用户信息，包含7天限制
- `updateLastLogin()`：更新最后登录时间

### 17.7 安全特性

#### 17.7.1 中间件安全
- **Helmet**：设置安全HTTP头，防止常见攻击
- **CORS**：配置跨域资源共享，支持指定源和凭证
- **速率限制**：15分钟内每个IP最多100个请求
- **请求大小限制**：JSON和表单数据最大10MB

#### 17.7.2 文件上传安全
- 只允许上传图片文件（jpeg, jpg, png, gif, webp）
- 限制文件大小（最大5MB）
- 生成唯一文件名，防止文件覆盖
- 自动创建上传目录

#### 17.7.3 数据验证
- 钱包地址唯一性验证
- 用户名唯一性验证
- 每7天只能修改一次个人信息

### 17.8 环境配置

| 环境变量 | 描述 | 默认值 |
|----------|------|--------|
| PORT | 服务器端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| MONGODB_URI | MongoDB连接字符串 | mongodb://localhost:27017/scia-dapp |
| CORS_ORIGIN | 允许的跨域源 | * |

### 17.9 服务器配置

#### 17.9.1 核心配置
```javascript
// 中间件配置
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
});
app.use(limiter);
```

### 17.10 支持的拓展功能

#### 17.10.1 社区即时聊天功能
- **技术选型**：集成Socket.io实现实时通信
- **拓展点**：
  - 新增`chatRoutes.js`和`chatController.js`
  - 新增`Message.js`模型存储聊天记录
  - 添加Socket.io服务器配置
  - 实现私聊、群聊、消息推送等功能

#### 17.10.2 即时语音视频功能
- **技术选型**：WebRTC + Socket.io（信令服务器）
- **拓展点**：
  - 新增`videoCallRoutes.js`处理音视频通话请求
  - 实现WebRTC信令服务器功能
  - 添加通话记录模型`VideoCall.js`
  - 集成STUN/TURN服务器配置

#### 17.10.3 商城功能
- **拓展点**：
  - 新增商品模型`Product.js`、订单模型`Order.js`、支付模型`Payment.js`
  - 实现商品CRUD、购物车、订单管理等API
  - 集成第三方支付接口（如加密货币支付或法币支付）
  - 添加库存管理、物流追踪等功能

#### 17.10.4 直播功能
- **技术选型**：
  - 方案1：集成第三方直播服务（如Twitch、YouTube Live API）
  - 方案2：自建直播服务器（如Node-Media-Server）
- **拓展点**：
  - 新增直播模型`LiveStream.js`存储直播信息
  - 实现直播推流、拉流、录制等功能
  - 添加直播间管理、礼物系统、弹幕功能
  - 集成支付系统支持打赏功能

### 17.11 拓展注意事项
1. **性能优化**：新增高并发功能（如直播、即时通讯）时，需要考虑：
   - 添加Redis缓存层
   - 实现负载均衡
   - 优化数据库查询
   - 使用CDN加速静态资源和媒体流

2. **安全加固**：
   - 完善JWT认证机制（当前预留，未完全实现）
   - 添加更细粒度的权限控制
   - 加强媒体文件的安全审核
   - 实现防止DDoS攻击的措施

3. **可维护性**：
   - 保持模块化设计原则
   - 编写完整的API文档
   - 添加单元测试和集成测试
   - 实现日志系统便于问题排查

## 17. 未来规划

### 17.1 功能扩展
- 添加更多代币支持
- 实现质押功能
- 添加治理机制
- 支持多链部署

### 17.2 技术升级
- 升级到最新的Solidity版本
- 优化前端架构
- 添加更多测试用例

## 18. 联系方式

### 18.1 项目负责人
- 姓名：[项目负责人姓名]
- 邮箱：[负责人邮箱]

### 18.2 开发团队
- 开发人员：[开发人员列表]
- 测试人员：[测试人员列表]

## 19. 问题记录与解决方案

### 19.1 数据库配置问题

#### 问题描述
- 新项目默认配置了MongoDB数据库，但系统中没有安装MongoDB服务
- MongoDB连接失败导致后端服务器崩溃
- 修改代码让服务器继续运行，但数据库功能不可用
- 无法读取之前注册的用户数据

#### 解决方案
1. 发现旧项目使用的是SQLite数据库，而非MongoDB
2. 将旧项目的SQLite数据库配置迁移到新项目中
3. 安装sqlite3依赖包
4. 修改后端代码，替换MongoDB连接为SQLite连接
5. 复制旧项目的数据库文件（users.db）到新项目目录
6. 重启后端服务器，恢复数据库功能

#### 实施细节
- 后端服务器端口：3001
- 数据库类型：SQLite
- 数据库文件：./users.db
- 支持的功能：用户注册、登录、个人信息管理

---

**创建日期**：2026-01-10  
**版本**：v1.2  
**最后更新**：2026-01-11