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
├── contracts/             # 智能合约目录（已部署测试网，合约间测试完成）
│   ├── core/            # 核心合约（预留）
│   └── modules/         # 功能模块合约
│       ├── PrivateSaleContract.sol  # 私募合约（已部署）
│       └── ReferralCenter.sol       # 推荐中心合约（已部署）
├── src/                  # 前端代码目录
│   ├── abi/             # 合约ABI文件
│   ├── components/       # 通用组件
│   ├── constants/        # 常量定义
│   ├── pages/            # 页面组件
│   └── App.tsx           # 应用入口
├── dist/                 # 构建输出目录
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
- 支持钱包连接作为身份验证方式

### 4.2 个人中心页面

#### 4.2.1 公开组件
1. **用户基本信息组件**
   - 展示钱包地址
   - 徽章图片及升级到下一等级所需积分
   - USDT余额、SCIA代币余额
   - 推荐人（显示钱包地址）

2. **推广信息组件**
   - 个人专属推广链接及二维码
   - 直接推荐显示最近5人
   - 获得的总积分
   - 查询所有推荐树按钮（调用合约接口展示所有推荐关系）

### 4.3 私募页面

#### 4.3.1 核心组件
- 私募信息展示
- 购买份数选择器
- 购买按钮
- 预估金额和代币数量同步展示
- 销售状态和池子信息展示

### 4.4 导航配置

#### 4.4.1 顶部导航
- 包含Sancta品牌标识
- 连接钱包按钮

#### 4.4.2 底部导航
- 私募
- 我

#### 4.4.3 页面配置
- 私募页面：已配置，可正常使用
- 个人中心页面：已配置，可正常使用

### 4.5 功能集成
- **当前工作重点**：DAPP与合约以及钱包之间的功能集成
- **合约状态**：所有合约已部署到测试网，合约间测试全部完成
- **项目结构**：已按照设计文档创建完整的前端项目结构
- **依赖安装**：已安装所有必要依赖，包括React 18、TypeScript、Vite 5、RainbowKit 2、Wagmi 2、Ant Design 5、Viem等
- **页面配置**：已完成基础页面和路由配置，包括私募页面、个人中心页面
- **已实现功能**：
  - ✅ 钱包连接功能：使用RainbowKit和Wagmi实现
  - ✅ 私募购买功能：完整实现，包括USDT余额检查、授权处理、交易状态管理和错误处理
  - ✅ 个人中心数据展示：基础信息、徽章和积分展示
  - ✅ 徽章和积分展示：从合约获取徽章等级和积分信息，显示当前徽章和升级所需剩余积分
  - ✅ USDT余额和授权查询：实时查询用户USDT余额和授权额度
  - ✅ SCIA余额查询：从合约获取实际的SCIA余额
  - ✅ 推荐系统完整功能：
    - ✅ 推荐人信息展示：显示用户的推荐人信息（显示钱包地址）
    - ✅ 直接推荐列表：展示最近5个直接推荐
    - ✅ 推荐树查询：实现完整推荐关系查询，支持所有推荐深度
    - ✅ 推荐关系注册：自动处理URL中的推荐人参数，注册推荐关系
    - ✅ 分红领取功能：显示可领取分红，支持按徽章等级领取
  - ✅ 交易状态管理：显示交易提交状态、等待确认状态和交易结果
  - ✅ 错误处理机制：处理钱包连接错误、余额不足、授权不足、合约暂停或结束、网络错误、交易被拒绝、合约拒绝等常见错误
  - ✅ 用户体验优化：实时显示余额和授权状态、预估金额和代币数量自动更新、友好的错误提示、购买按钮状态根据条件动态变化、交易结果清晰展示
  - ✅ 复制链接功能：完整实现，使用navigator.clipboard API，支持成功/失败提示
  - ✅ 推广二维码生成：完整实现，使用qrcode.react库生成二维码，支持下载真实的SVG文件
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
  - 前端未使用到的合约函数：
    - `setPrivateSaleContract` - 设置私募合约地址（管理员功能）
    - `freezeBadges` - 冻结徽章（管理员功能）
    - `fundBadgePool` - 为徽章池注入资金（管理员功能）
    - `getBadgeCount` - 获取徽章数量
    - `hasReferrerEligibility` - 检查推荐人资格
  - 管理员功能：前端没有实现相关的UI组件
  - 事件监听：前端没有监听所有合约事件（如徽章获得、积分更新等），无法实时更新所有数据
  - 分红周期显示：前端没有显示当前分红周期的开始和结束时间

- **建议的下一步工作**：
  - 优化用户体验和界面设计
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



## 17. 问题记录与解决方案

### 17.1 钱包连接状态问题

#### 问题描述
- 用户连接钱包后，需要确保钱包状态正确同步到所有组件

#### 解决方案
1. 使用Wagmi的useAccount hook获取钱包连接状态
2. 确保所有需要钱包状态的组件正确使用该hook
3. 实现组件间状态同步，确保UI正确反映钱包连接状态

---

**创建日期**：2026-01-10  
**版本**：V1.1.7  
**最后更新**：2026-01-13