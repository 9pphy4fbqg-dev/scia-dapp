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
├── dist/                 # 构建输出目录
│   └── assets/          # 静态资源
│       ├── logo/        # LOGO资源
│       └── splash/      # 开屏动画资源
├── project_index.md      # 项目索引文件（本文件）
```

## 3. DAPP设计与功能

### 3.1 核心设计原则
- DAPP内部不负责任何计算，只调用合约以及链上数据
- 主网DAPP建立数据库用于储存用户注册信息
- 支持钱包连接作为身份验证方式

### 3.2 用户注册系统

#### 3.2.1 注册流程
- 用户点击"连接钱包"，完成钱包连接
- 已注册用户直接进入个人中心页面
- 未注册用户弹出注册页面，要求用户注册
- 未注册用户可浏览所有页面，但无法使用功能
- 点击任何功能按钮时，友好引导用户注册

#### 3.2.2 注册信息
- 自定义头像上传功能
- 用户名输入功能（支持中文、英文、数字、符号）
- 注册信息保存到服务器
- 每7天允许用户修改一次用户名和头像

### 3.3 个人中心页面

#### 3.3.1 公开组件
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

#### 3.3.2 隐藏组件（仅合约所有者可见）
- 合约管理按钮
- DAPP管理按钮
- 链上统计按钮

### 3.4 私募页面

#### 3.4.1 核心组件
- 私募信息展示
- 购买份数选择器
- 购买按钮
- 预估金额和代币数量同步展示
- 不展示销售状态和池子信息

### 3.5 导航配置

#### 3.5.1 顶部导航
- 包含Sancta品牌标识
- 连接钱包按钮

#### 3.5.2 底部导航
- 私募
- 数据
- 社区
- 商城
- NFT
- 我
- 统计

#### 3.5.3 页面配置
- 私募页面：已配置，可正常使用
- 个人中心页面：已配置，可正常使用
- 数据、社区、商城、NFT、统计页面：
  - 可正常跳转
  - 跳转后显示"该功能正在开发中"

### 3.6 功能集成
- **当前工作重点**：DAPP与合约以及钱包之间的功能集成
- **合约状态**：所有合约已部署到测试网，合约间测试全部完成
- **静态资源**：已准备就绪，包含LOGO和开屏动画资源
- **项目结构**：已按照设计文档创建完整的前端项目结构
- **依赖安装**：已安装所有必要依赖，包括React 18、TypeScript、Vite 5、Redux Toolkit、RTK Query、RainbowKit 2、Wagmi 2、Ant Design 5、Viem等
- **页面配置**：已完成基础页面和路由配置
- **后续计划**：
  - 实现钱包连接功能
  - 集成私募购买功能
  - 实现个人中心数据展示
  - 集成推荐系统功能
  - 实现徽章和积分展示

## 4. 功能模块

### 4.1 私募合约（PrivateSaleContract）

#### 4.1.1 核心功能
- 双池设计：私募池和奖励池
- 支持USDT支付购买SCIA代币
- 推荐奖励机制
- 自动售罄检测和处理
- 管理员功能（暂停/结束销售、存款、提款等）

#### 4.1.2 关键参数
- 代币价格：0.00001 USDT/SCIA（测试网，实际应为0.1 USDT/SCIA，即10000000000000 wei USDT/SCIA）
- 每包USDT：0.01 USDT（测试网，实际应为100 USDT，即10000000000000000 wei USDT）
- 每包SCIA：1000 SCIA（即1000000000000000000000 wei SCIA）
- 最小购买：1 package
- 最大购买：1000 packages
- 推荐奖励：5% SCIA + 5% USDT（通过REFERRAL_SCIAs_RATE=500和REFERRAL_USDT_RATE=500计算，分母为10000）

#### 4.1.3 主要函数
- `buyTokens(uint256 packages, address referrer)` - 购买代币
- `setSaleStatus(bool _isPaused)` - 设置销售状态
- `endSale()` - 结束销售
- `depositTokens(uint256 privateSaleAmount, uint256 rewardAmount)` - 存入代币
- `getPoolInfo()` - 获取池信息

### 4.2 推荐中心合约（ReferralCenter）

#### 4.2.1 核心功能
- 推荐关系注册（永久绑定）
- 积分系统（无限代传递）
- 徽章等级管理
- 分红发放机制

#### 4.2.2 徽章系统
- **会员徽章**：0.11 USDT（测试网，实际应为1100 USDT）
- **市级徽章**：0.55 USDT（测试网，实际应为5500 USDT）
- **省级徽章**：2.75 USDT（测试网，实际应为27500 USDT）
- **国家级徽章**：13.75 USDT（测试网，实际应为137500 USDT）

#### 4.2.3 主要函数
- `registerReferral(address referrer)` - 注册推荐关系
- `updatePoints(address user, uint256 amount)` - 更新积分
- `checkBadgeEligibility(address user)` - 检查徽章资格
- `freezeBadges()` - 冻结徽章
- `claimDividend(BadgeLevel badgeLevel)` - 领取分红

## 5. 技术栈

### 5.1 智能合约
- Solidity ^0.8.19
- OpenZeppelin Contracts（Ownable, ReentrancyGuard, IERC20）

### 5.2 前端（计划）
- React 18
- TypeScript
- Vite 5
- Redux Toolkit
- RTK Query
- RainbowKit 2 + Wagmi 2
- Ant Design 5
- Viem

### 5.3 开发工具
- Hardhat（智能合约开发和测试）
- Ethers.js v6（辅助区块链交互）

## 6. 合约接口定义

### 6.1 PrivateSaleContract 接口
```solidity
interface IPrivateSaleContract {
    function buyTokens(uint256 packages, address referrer) external;
    function getPoolInfo() external view returns (
        uint256 remainingPrivateSale, 
        uint256 remainingRewardPool,
        uint256 currentPrivateSaleBalance,
        uint256 currentRewardPoolBalance,
        uint256 totalSoldSCIA,
        uint256 totalRewardDistributedSCIA
    );
    function setSaleStatus(bool _isPaused) external;
    function endSale() external;
}
```

### 6.2 ReferralCenter 接口
```solidity
interface IReferralCenter {
    function registerReferral(address referrer) external;
    function updatePoints(address user, uint256 amount) external;
    function checkBadgeEligibility(address user) external;
    function freezeBadges() external;
    function getUserBadgeInfo(address user) external view returns (
        BadgeLevel badgeLevel,
        uint256 userPoints,
        uint256 nextBadgeThreshold
    );
    function claimDividend(BadgeLevel badgeLevel) external;
}
```

## 7. 依赖关系

### 7.1 合约依赖
- PrivateSaleContract 依赖 ReferralCenter 合约
- ReferralCenter 依赖 PrivateSaleContract 合约
- 两者均依赖 OpenZeppelin Contracts

### 7.2 外部依赖
- SCIA代币合约（ERC20）
- USDT代币合约（ERC20）

## 8. 开发流程

### 8.1 智能合约开发
1. 编写合约代码
2. 运行单元测试
3. 部署到测试网
4. 进行测试网测试
5. 部署到主网

### 8.2 前端开发
1. 初始化项目
2. 配置核心库（Redux Toolkit, Wagmi, RainbowKit等）
3. 实现UI组件
4. 集成合约交互
5. 测试和优化
6. 构建和部署

## 9. 关键合约事件

### 9.1 PrivateSaleContract 事件
- `SaleStatusChanged(bool isPaused, bool isEnded)` - 销售状态变更
- `TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 sciaAmount, address referrer)` - 代币购买
- `ReferralRewardDistributed(address indexed referrer, uint256 sciaReward, uint256 usdtReward)` - 推荐奖励分发
- `SaleEnded(uint256 totalSold, uint256 totalRewardDistributed)` - 销售结束

### 9.2 ReferralCenter 事件
- `ReferralRegistered(address indexed user, address indexed referrer)` - 推荐关系注册
- `PointsUpdated(address indexed user, uint256 oldPoints, uint256 newPoints)` - 积分更新
- `BadgeAchieved(address indexed user, BadgeLevel badgeLevel, uint256 timestamp)` - 徽章获得
- `DividendClaimed(address indexed user, uint8 indexed badgeLevel, uint256 amount)` - 分红领取
- `BadgesFrozen()` - 徽章冻结

## 10. 权限管理

### 10.1 合约所有者
- 可暂停/结束销售
- 可存入/提取代币
- 可设置合约地址
- 可冻结徽章

### 10.2 普通用户
- 可购买代币
- 可注册推荐关系
- 可领取分红
- 可查看自己的积分和徽章

## 11. 测试网配置

### 11.1 测试网参数（已缩小10000倍）
- 代币价格：0.00001 USDT/SCIA
- 每包USDT：0.01 USDT
- 每包SCIA：1000 SCIA

### 11.2 徽章阈值（测试网）
- 会员徽章：0.11积分
- 市级徽章：0.55积分
- 省级徽章：2.75积分
- 国家级徽章：13.75积分

## 12. 主网配置（预计）

### 12.1 主网参数
- 代币价格：0.1 USDT/SCIA
- 每包USDT：100 USDT
- 每包SCIA：1000 SCIA

### 12.2 徽章阈值（主网）
- 会员徽章：1100积分
- 市级徽章：5500积分
- 省级徽章：27500积分
- 国家级徽章：137500积分

## 13. 安全考虑

### 13.1 合约安全
- 使用 ReentrancyGuard 防止重入攻击
- 使用 Ownable 管理权限
- 严格的输入验证
- 事件日志完整

### 13.2 前端安全
- 使用安全的钱包连接库（Wagmi + RainbowKit）
- 合约地址从配置文件获取，避免硬编码
- 敏感操作需要用户确认

## 14. 性能优化

### 14.1 合约性能
- 减少不必要的状态变量更新
- 优化循环逻辑（推荐链遍历）
- 使用高效的存储结构

### 14.2 前端性能
- 使用 RTK Query 缓存数据
- 优化组件渲染
- 减少不必要的合约调用

## 15. 监控和维护

### 15.1 合约监控
- 监控合约事件
- 定期检查池余额
- 监控异常交易

### 15.2 前端监控
- 监控页面加载时间
- 监控用户行为
- 监控错误日志

## 16. 未来规划

### 16.1 功能扩展
- 添加更多代币支持
- 实现质押功能
- 添加治理机制
- 支持多链部署

### 16.2 技术升级
- 升级到最新的Solidity版本
- 优化前端架构
- 添加更多测试用例

## 17. 联系方式

### 17.1 项目负责人
- 姓名：[项目负责人姓名]
- 邮箱：[负责人邮箱]

### 17.2 开发团队
- 开发人员：[开发人员列表]
- 测试人员：[测试人员列表]

---

**创建日期**：2026-01-10  
**版本**：v1.0  
**最后更新**：2026-01-10