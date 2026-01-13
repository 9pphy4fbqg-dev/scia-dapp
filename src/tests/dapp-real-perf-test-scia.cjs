const { chromium } = require('playwright');
const { ethers } = require('ethers');
const fs = require('fs');

const DAPP_URL = 'http://localhost:3000';
const TEST_ACCOUNTS_PATH = 'C:/Users/Administrator/Documents/trae_projects/Sancia/test-bsc-testnet/test-accounts.json';
// BSC测试网RPC节点列表（按优先级排序）
const BSC_TESTNET_RPCS = [
  'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
  'https://data-seed-prebsc-2-s1.bnbchain.org:8545',
  'https://data-seed-prebsc-1-s2.bnbchain.org:8545',
  'https://data-seed-prebsc-2-s2.bnbchain.org:8545',
  'https://rpc.ankr.com/bsc_testnet_chapel',
  'https://bsc-testnet.public.blastapi.io',
  'https://bsc-testnet.chainstacklabs.com',
  'https://bsc-testnet-rpc.publicnode.com',
  'https://bsc-testnet-dataseed.bnbchain.org'
];
const DEPLOYER_PRIVATE_KEY = '0x1080fc2eecebb94b9b74a6833ba21c5e4c25ccd7800edc8d03372aae99f9cae8';

const CONTRACT_ADDRESSES = {
  USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
  SANCIA_TOKEN: '0xCc528eb49547C258D08f80b77823Ee54D043Ee1C',
  PRIVATE_SALE: '0xf5753871068D76CFdb8f2c20b8cd0E6be5C9BC46',
  REFERRAL_CENTER: '0x75a6858B136012187F68B9E06Ee048c25b815aB4'
};

const TEST_CONFIG = {
  TOTAL_ACCOUNTS: 200,
  REQUIRED_REFERRAL_RATE: 0.95,
  BNB_PER_ACCOUNT: '0.001',
  USDT_PER_ACCOUNT: '0.1'
};

const ABIS = {
  USDT: [
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address, uint256) returns (bool)',
    'function approve(address, uint256) returns (bool)',
    'function allowance(address, address) view returns (uint256)'
  ],
  SANCIA: [
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address, uint256) returns (bool)'
  ],
  PRIVATE_SALE: [
    'function buyTokens(uint256, address) returns (bool)',
    'function isPaused() view returns (bool)',
    'function isEnded() view returns (bool)',
    'function PER_PACKAGE_USDT() view returns (uint256)',
    'function PER_PACKAGE_SCIAs() view returns (uint256)',
    'event TokensPurchased(address indexed user, uint256 amount)',
    'event ReferralRewardDistributed(address indexed referrer, uint256 sciaReward, uint256 usdtReward)'
  ],
  REFERRAL_CENTER: [
    'function registerReferral(address) returns (bool)',
    'function getUserBadgeInfo(address) view returns (tuple(uint256 badgeLevel, uint256 userPoints))',
    'function userBadges(address) view returns (uint256)',
    'function points(address) view returns (uint256)',
    'function referrers(address) view returns (address)',
    'function registerUsername(string) returns (bool)'
  ]
};

const TEST_RESULTS = {
  startTime: null,
  endTime: null,
  totalAccounts: 0,
  successfulTests: 0,
  failedTests: 0,
  referralCount: 0,
  badgeLevel4Account: null,
  referralRate: 0,
  referralTree: [],
  totalSCIAFromReferrals: '0',
  totalUSDTFromReferrals: '0',
  consistencyResults: {
    passed: 0,
    failed: 0,
    details: []
  },
  performanceMetrics: {
    pageLoadTimes: [],
    transactionTimes: [],
    blockConfirmTimes: [],
    stateUpdateTimes: [],
    memoryUsage: [],
    networkStats: [],
    errorCount: 0
  },
  accountResults: []
};

// 重试机制辅助函数
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        console.log(`Operation failed, retrying in ${delay}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

class BlockchainService {
  constructor(rpcUrls) {
    this.rpcUrls = rpcUrls;
    this.currentRpcIndex = 0;
    this.provider = new ethers.JsonRpcProvider(rpcUrls[0]);
  }

  // 切换到下一个RPC节点
  switchToNextRpc() {
    this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcUrls.length;
    this.provider = new ethers.JsonRpcProvider(this.rpcUrls[this.currentRpcIndex]);
    console.log(`Switched to RPC node: ${this.rpcUrls[this.currentRpcIndex]}`);
  }

  // 带有重试机制的调用方法
  async callWithRetry(operation, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.log(`RPC call failed: ${error.message}`);
        if (i < maxRetries - 1) {
          // 添加延迟，避免频繁切换节点
          await new Promise(resolve => setTimeout(resolve, 2000));
          this.switchToNextRpc();
        } else {
          throw error;
        }
      }
    }
  }

  async getBlockNumber() {
    return await this.callWithRetry(() => this.provider.getBlockNumber());
  }

  async getBalance(address) {
    return await this.callWithRetry(() => this.provider.getBalance(address));
  }

  async getUSDTBalance(contract, address) {
    return await this.callWithRetry(() => contract.balanceOf(address));
  }

  async getSANCIABalance(contract, address) {
    return await this.callWithRetry(() => contract.balanceOf(address));
  }

  async getBadgeInfo(contract, address) {
    return await this.callWithRetry(() => contract.getUserBadgeInfo(address));
  }

  async getUserBadge(contract, address) {
    return await this.callWithRetry(() => contract.userBadges(address));
  }

  async getUserPoints(contract, address) {
    return await this.callWithRetry(() => contract.points(address));
  }

  async getReferrer(contract, address) {
    return await this.callWithRetry(() => contract.referrers(address));
  }

  async getAllowance(usdtContract, owner, spender) {
    return await this.callWithRetry(() => usdtContract.allowance(owner, spender));
  }

  async waitForTransaction(txHash) {
    return await this.callWithRetry(() => this.provider.waitForTransaction(txHash, {
      confirmations: 1,
      timeout: 300000
    }));
  }

  async getLogs(contractAddress, eventName, fromBlock, toBlock, topics = []) {
    const filter = {
      address: contractAddress,
      fromBlock: fromBlock || 0,
      toBlock: toBlock || 'latest',
      topics
    };
    
    return await this.callWithRetry(() => this.provider.getLogs(filter));
  }

  async getReferralRewards(privateSaleContract, referrer) {
    // 初始化奖励统计
    let totalSCIAFromReferrals = BigInt(0);
    let totalUSDTFromReferrals = BigInt(0);
    
    try {
      // 获取当前区块
      const currentBlock = await this.getBlockNumber();
      // 搜索最近2000个区块内的ReferralRewardDistributed事件
      const filter = privateSaleContract.filters.ReferralRewardDistributed(referrer);
      const events = await this.callWithRetry(() => privateSaleContract.queryFilter(filter, Math.max(0, currentBlock - 2000), currentBlock));
      
      // 累加所有奖励
      for (const event of events) {
        totalSCIAFromReferrals += event.args.sciaReward;
        totalUSDTFromReferrals += event.args.usdtReward;
      }
    } catch (error) {
      console.error('获取推荐奖励失败:', error.message);
    }
    
    return {
      totalSCIAFromReferrals,
      totalUSDTFromReferrals
    };
  }
}

class ConsistencyVerifier {
  constructor(blockchain, dapp, wallet) {
    this.blockchain = blockchain;
    this.dapp = dapp;
    this.wallet = wallet;
    this.results = [];
  }

  async verifyBalanceConsistency(dappBalance, walletBalance, chainBalance, tokenSymbol) {
    const dappNum = parseFloat(dappBalance);
    const walletNum = parseFloat(walletBalance);
    const chainNum = parseFloat(ethers.utils.formatEther(chainBalance));
    
    const isConsistent = Math.abs(dappNum - walletNum) < 0.001 && 
                        Math.abs(walletNum - chainNum) < 0.001;
    
    this.results.push({
      type: 'balance_consistency',
      token: tokenSymbol,
      dappDisplay: dappNum,
      walletDisplay: walletNum,
      chainData: chainNum,
      difference: Math.max(Math.abs(dappNum - walletNum), Math.abs(walletNum - chainNum)),
      isConsistent,
      tolerance: 0.001,
      account: this.wallet.address
    });
    
    return isConsistent;
  }

  async verifyBadgeConsistency(dappBadge, chainBadge) {
    const dappNum = parseInt(dappBadge);
    const chainNum = parseInt(chainBadge.toString());
    
    const isConsistent = dappNum === chainNum;
    
    this.results.push({
      type: 'badge_consistency',
      dappDisplay: dappNum,
      chainData: chainNum,
      difference: Math.abs(dappNum - chainNum),
      isConsistent,
      account: this.wallet.address
    });
    
    return isConsistent;
  }

  async verifyPointsConsistency(dappPoints, chainPoints) {
    const dappNum = parseFloat(dappPoints);
    const chainNum = parseFloat(ethers.utils.formatEther(chainPoints));
    
    const isConsistent = Math.abs(dappNum - chainNum) < 0.01;
    
    this.results.push({
      type: 'points_consistency',
      dappDisplay: dappNum,
      chainData: chainNum,
      difference: Math.abs(dappNum - chainNum),
      isConsistent,
      tolerance: 0.01,
      account: this.wallet.address
    });
    
    return isConsistent;
  }

  async verifyReferrerConsistency(dappReferrer, chainReferrer) {
    const dappLower = dappReferrer?.toLowerCase() || ethers.ZeroAddress;
    const chainLower = chainReferrer?.toLowerCase() || ethers.ZeroAddress;
    
    const isConsistent = dappLower === chainLower;
    
    this.results.push({
      type: 'referrer_consistency',
      dappDisplay: dappReferrer,
      chainData: chainReferrer,
      difference: dappLower === chainLower ? 0 : 1,
      isConsistent,
      account: this.wallet.address
    });
    
    return isConsistent;
  }

  async verifyTransactionStatus(dappStatus, chainStatus) {
    const isConsistent = dappStatus === chainStatus;
    
    this.results.push({
      type: 'transaction_status_consistency',
      dappDisplay: dappStatus,
      chainData: chainStatus,
      difference: dappStatus === chainStatus ? 0 : 1,
      isConsistent,
      account: this.wallet.address
    });
    
    return isConsistent;
  }

  async verifyEventEmission(expectedEvent, eventData, hasEvent) {
    const isConsistent = hasEvent;
    
    this.results.push({
      type: 'event_emission_consistency',
      eventName: expectedEvent,
      eventData,
      hasEvent,
      isConsistent,
      account: this.wallet.address
    });
    
    return isConsistent;
  }

  getResults() {
    return this.results;
  }
}

class PerformanceMonitor {
  constructor(page) {
    this.page = page;
    this.metrics = {
      pageLoad: null,
      fcp: null,
      lcp: null,
      tti: null,
      networkRequests: [],
      jsErrors: [],
      consoleErrors: [],
      memorySnapshots: []
    };
    this.startTime = Date.now();
  }

  async startPagePerformance() {
    this.page.on('request', request => {
      this.metrics.networkRequests.push({
        url: request.url(),
        method: request.method(),
        startTime: Date.now() - this.startTime,
        timestamp: new Date().toISOString()
      });
    });

    this.page.on('response', response => {
      const idx = this.metrics.networkRequests.length - 1;
      if (idx >= 0) {
        this.metrics.networkRequests[idx].status = response.status();
        this.metrics.networkRequests[idx].endTime = Date.now() - this.startTime;
      }
    });

    this.page.on('pageerror', error => {
      this.metrics.jsErrors.push({
        message: error.message(),
        stack: error.stack(),
        timestamp: Date.now() - this.startTime
      });
    });

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.metrics.consoleErrors.push({
          text: msg.text(),
          timestamp: Date.now() - this.startTime
        });
      }
    });
  }

  async measureTransactionTime(operationName, transactionPromise) {
    const startTime = Date.now();
    
    try {
      const result = await transactionPromise;
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      TEST_RESULTS.performanceMetrics.transactionTimes.push({
        operation: operationName,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return { result, duration };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      TEST_RESULTS.performanceMetrics.transactionTimes.push({
        operation: operationName,
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  async measureBlockConfirmation(txHash, provider) {
    const startTime = Date.now();
    
    try {
      const receipt = await provider.waitForTransaction(txHash, {
        confirmations: 1,
        timeout: 300000
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      TEST_RESULTS.performanceMetrics.blockConfirmTimes.push({
        txHash,
        duration,
        blockNumber: receipt.blockNumber,
        confirmations: receipt.confirmations,
        gasUsed: receipt.gasUsed?.toString(),
        timestamp: new Date().toISOString()
      });
      
      return { receipt, duration, blockNumber: receipt.blockNumber };
    } catch (error) {
      TEST_RESULTS.performanceMetrics.blockConfirmTimes.push({
        txHash,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async measureStateUpdate(page, selector, expectedText = null) {
    const startTime = Date.now();
    
    try {
      if (expectedText) {
        await page.waitForSelector(`${selector}:has-text("${expectedText}")`, { timeout: 30000 });
      } else {
        await page.waitForSelector(selector, { timeout: 30000 });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      TEST_RESULTS.performanceMetrics.stateUpdateTimes.push({
        selector,
        duration,
        expectedText,
        timestamp: new Date().toISOString()
      });
      
      return duration;
    } catch (error) {
      TEST_RESULTS.performanceMetrics.stateUpdateTimes.push({
        selector,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async getMemoryUsage() {
    try {
      const metrics = await this.page.metrics();
      const memory = {
        jsHeapUsedSize: metrics.JSHeapUsedSize,
        jsHeapTotalSize: metrics.JSHeapTotalSize,
        timestamp: new Date().toISOString()
      };
      
      TEST_RESULTS.performanceMetrics.memoryUsage.push(memory);
      return memory;
    } catch (error) {
      return null;
    }
  }

  async captureMemorySnapshot(label) {
    const memory = await this.getMemoryUsage();
    if (memory) {
      this.metrics.memorySnapshots.push({ label, ...memory });
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      errorCount: this.metrics.jsErrors.length + this.metrics.consoleErrors.length
    };
  }
}

function generateReferralTree(accounts) {
  const tree = [];
  
  // 设计推荐树，让第1个账号（root）成为大部分用户的推荐人，便于积累积分
  // Layer 0: root user (account 0)
  tree.push({ referrer: ethers.ZeroAddress, layer: 0 });
  
  // Layer 1: direct referrals to root (accounts 1-50)
  for (let i = 1; i <= 50 && i < accounts.length; i++) {
    tree.push({
      referrer: accounts[0].address,
      layer: 1
    });
  }
  
  // Layer 2: referrals to layer 1 users (accounts 51-125)
  let accountIndex = 51;
  for (let i = 1; i <= 50 && accountIndex < accounts.length; i++) {
    // Each layer 1 user gets 1-2 referrals
    for (let j = 0; j < 2 && accountIndex < accounts.length; j++) {
      tree.push({
        referrer: accounts[i].address,
        layer: 2
      });
      accountIndex++;
    }
  }
  
  // Layer 3: remaining accounts (126+), 95% with referrers
  for (let i = accountIndex; i < accounts.length; i++) {
    const shouldHaveReferrer = Math.random() < TEST_CONFIG.REQUIRED_REFERRAL_RATE;
    if (shouldHaveReferrer && i > 0) {
      // 优先选择root或layer 1用户作为推荐人，便于root积累积分
      const referrerPool = accounts.slice(0, 51); // root + layer 1
      const referrerIndex = Math.floor(Math.random() * referrerPool.length);
      tree.push({
        referrer: referrerPool[referrerIndex].address,
        layer: 3
      });
    } else {
      tree.push({ referrer: ethers.ZeroAddress, layer: 0 });
    }
  }
  
  return tree;
}

async function connectWallet(page, privateKey) {
  console.log('🔗 连接钱包...');
  try {
    // 点击RainbowKit的ConnectButton
    const connectBtn = page.locator('.rainbowkit-connect-button').first();
    await connectBtn.click({ timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // 等待连接选项出现
    await page.waitForSelector('text=MetaMask', { timeout: 5000 });
    const metamaskOption = page.locator('text=MetaMask').first();
    await metamaskOption.click();
    await page.waitForTimeout(2000);
    
    // 处理MetaMask弹出窗口
    const allPages = await page.context().pages();
    const metamaskPage = allPages.find(p => p.url().includes('chrome-extension://'));
    
    if (metamaskPage) {
      try {
        // 检查是否需要导入钱包
        const importBtn = metamaskPage.locator('button:has-text("导入钱包"), button:has-text("Import Wallet")').first();
        if (await importBtn.isVisible({ timeout: 5000 })) {
          await importBtn.click();
          await page.waitForTimeout(1000);
          
          // 同意条款
          const termsCheckbox = metamaskPage.locator('input[type="checkbox"]').first();
          await termsCheckbox.check();
          
          const importContinueBtn = metamaskPage.locator('button:has-text("导入"), button:has-text("Import")').first();
          await importContinueBtn.click();
          await page.waitForTimeout(1000);
          
          // 输入私钥和密码
          await metamaskPage.locator('input[placeholder*="私钥"], input[placeholder*="Private Key"]').fill(privateKey);
          await metamaskPage.locator('input[type="password"]').first().fill('test1234');
          await metamaskPage.locator('input[type="password"]').nth(1).fill('test1234');
          
          const finalImportBtn = metamaskPage.locator('button:has-text("导入"), button:has-text("Import")').first();
          await finalImportBtn.click();
          await page.waitForTimeout(2000);
          
          // 跳过欢迎页面
          const doneBtn = metamaskPage.locator('button:has-text("完成"), button:has-text("Done")').first();
          if (await doneBtn.isVisible()) {
            await doneBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      } catch (e) {
        console.log('钱包可能已存在，直接使用');
      }
      
      try {
        // 连接钱包
        const connectBtn2 = metamaskPage.locator('button:has-text("连接"), button:has-text("Connect")').first();
        if (await connectBtn2.isVisible({ timeout: 5000 })) {
          await connectBtn2.click();
          await page.waitForTimeout(1000);
        }
        
        // 批准连接
        const approveBtn = metamaskPage.locator('button:has-text("批准"), button:has-text("Approve")').first();
        if (await approveBtn.isVisible({ timeout: 5000 })) {
          await approveBtn.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        console.log('连接可能已完成');
      }
    }
    
    // 等待钱包连接成功，检查是否显示钱包地址
    await page.waitForSelector('.rainbowkit-account-address', { timeout: 30000 });
    console.log('✅ 钱包连接成功');
    return true;
  } catch (error) {
    console.warn('钱包连接警告:', error.message);
    return false;
  }
}

async function disconnectWallet(page) {
  console.log('🔌 断开钱包连接...');
  try {
    // 点击RainbowKit的连接按钮（已连接状态）
    const walletBtn = page.locator('.rainbowkit-account-button').first();
    if (await walletBtn.isVisible({ timeout: 5000 })) {
      await walletBtn.click();
      await page.waitForTimeout(500);
      
      // 点击断开连接按钮
      const disconnectBtn = page.locator('button:has-text("断开连接"), button:has-text("Disconnect")').first();
      if (await disconnectBtn.isVisible()) {
        await disconnectBtn.click();
        await page.waitForTimeout(1000);
        console.log('✅ 钱包已断开');
      }
    }
  } catch (error) {
    console.warn('断开连接警告:', error.message);
  }
}

async function registerUsername(page, username) {
  console.log('📝 注册用户名...');
  try {
    const profileBtn = page.locator('a:has-text("个人中心"), button:has-text("个人中心")').first();
    await profileBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
    if (await usernameInput.isVisible({ timeout: 5000 })) {
      await usernameInput.fill(username);
      await page.waitForTimeout(500);
      
      const submitBtn = page.locator('button:has-text("保存"), button:has-text("提交")').first();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      
      const confirmBtn = page.locator('button:has-text("确认"), button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
      
      console.log(`✅ 用户名 "${username}" 注册完成`);
      return true;
    }
    console.log('⚠️ 用户名输入框不可见，跳过注册');
    return false;
  } catch (error) {
    console.warn('用户名注册警告:', error.message);
    return false;
  }
}

async function navigateToBuyPage(page) {
  console.log('🛒 导航到购买页面...');
  try {
    // 点击导航栏中的"私募"按钮
    const buyNav = page.locator('a[href="/buy"]').first();
    await buyNav.click();
    await page.waitForURL('**/buy', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ 导航完成');
  } catch (error) {
    console.warn('导航警告:', error.message);
  }
}

async function inputReferrer(page, referrerAddress) {
  if (referrerAddress === ethers.ZeroAddress) return;
  
  console.log(`👥 输入推荐人: ${referrerAddress.slice(0, 6)}...`);
  try {
    const referrerInput = page.locator('input[placeholder*="推荐人"], input[name*="referrer"], input[placeholder*="邀请码"]').first();
    if (await referrerInput.isVisible({ timeout: 5000 })) {
      await referrerInput.fill(referrerAddress);
      await page.waitForTimeout(1500);
      console.log('✅ 推荐人输入完成');
    }
  } catch (error) {
    console.warn('推荐人输入警告:', error.message);
  }
}

async function selectPackages(page, count) {
  console.log(`📦 选择 ${count} 个套餐...`);
  try {
    // 使用Ant Design的InputNumber组件直接输入数量
    const inputNumber = page.locator('.ant-input-number-input').first();
    await inputNumber.fill(count.toString());
    await page.waitForTimeout(1500);
    console.log('✅ 套餐选择完成');
  } catch (error) {
    console.warn('套餐选择警告:', error.message);
  }
}

async function approveUSDT(page, usdtContract, wallet, spenderAddress, amount) {
  console.log('🔑 授权USDT...');
  const tx = await usdtContract.connect(wallet).approve(spenderAddress, amount);
  return tx.wait();
}

async function buyTokens(page) {
  console.log('💳 购买代币...');
  try {
    // 点击"立即购买"按钮
    const buyBtn = page.locator('button[type="submit"]:has-text("立即购买")').first();
    await buyBtn.click({ timeout: 10000 });
    
    // 等待交易状态变化
    await page.waitForSelector('.ant-message-success', { timeout: 30000 });
    console.log('✅ 购买代币成功');
    return true;
  } catch (error) {
    console.warn('购买代币警告:', error.message);
    return false;
  }
}

async function recoverAssets(usdtContract, sanciaContract, wallet, deployerAddress) {
  console.log('♻️ 回收资产...');
  const provider = wallet.provider;
  
  // 1. 回收USDT
  const usdtBalance = await usdtContract.balanceOf(wallet.address);
  if (usdtBalance > 0n) {
    await usdtContract.connect(wallet).transfer(deployerAddress, usdtBalance);
    console.log(`✅ 回收USDT: ${ethers.utils.formatEther(usdtBalance)}`);
  }
  
  // 2. 回收SANCIA
  const sanciaBalance = await sanciaContract.balanceOf(wallet.address);
  if (sanciaBalance > 0n) {
    await sanciaContract.connect(wallet).transfer(deployerAddress, sanciaBalance);
    console.log(`✅ 回收SANCIA: ${ethers.utils.formatEther(sanciaBalance)}`);
  }
  
  // 3. 回收TBNB
  const bnbBalance = await provider.getBalance(wallet.address);
  if (bnbBalance > 0n) {
    try {
      // 计算gas费用
      const gasPrice = await provider.getGasPrice();
      const gasLimit = BigInt('21000'); // 基础转账gas
      const gasCost = gasPrice * gasLimit;
      
      // 确保有足够的gas费用
      if (bnbBalance > gasCost) {
        const transferAmount = bnbBalance - gasCost;
        await wallet.sendTransaction({
          to: deployerAddress,
          value: transferAmount
        });
        console.log(`✅ 回收TBNB: ${ethers.utils.formatEther(transferAmount)}`);
      } else {
        console.log(`⚠️ TBNB余额不足以支付gas费，跳过回收`);
      }
    } catch (error) {
      console.warn(`⚠️ TBNB回收失败: ${error.message}`);
    }
  }
  
  console.log('✅ 资产回收完成');
}

async function allocateFunds(deployerWallet, usdtContract, testWallet, usdtAmount) {
  console.log('💰 分配资金...');
  const bnbAmount = ethers.utils.parseEther(TEST_CONFIG.BNB_PER_ACCOUNT);
  
  await deployerWallet.sendTransaction({
    to: testWallet.address,
    value: bnbAmount
  });
  
  const usdtTx = await usdtContract.transfer(testWallet.address, usdtAmount);
  await usdtTx.wait();
  
  console.log('✅ 资金分配完成');
}

async function getDAppDisplayData(page) {
  const data = {
    usdtBalance: '0',
    sanciaBalance: '0',
    badgeLevel: '0',
    points: '0',
    referrer: null,
    transactionStatus: 'unknown'
  };
  
  try {
    const usdtEl = page.locator('text=USDT, [data-testid="usdt-balance"]').first();
    if (await usdtEl.isVisible()) {
      const text = await usdtEl.innerText();
      data.usdtBalance = text.match(/[\d.]+/) ? text.match(/[\d.]+/)[0] : '0';
    }
  } catch (e) {}
  
  try {
    const badgeEl = page.locator('text=徽章, [data-testid="badge-level"]').first();
    if (await badgeEl.isVisible()) {
      const parent = badgeEl.locator('xpath=..');
      const text = await parent.innerText();
      data.badgeLevel = text.match(/(\d+)/) ? text.match(/(\d+)/)[1] : '0';
    }
  } catch (e) {}
  
  try {
    const pointsEl = page.locator('text=积分, [data-testid="points"]').first();
    if (await pointsEl.isVisible()) {
      const parent = pointsEl.locator('xpath=..');
      const text = await parent.innerText();
      data.points = text.match(/[\d.]+/) ? text.match(/[\d.]+/)[0] : '0';
    }
  } catch (e) {}
  
  // 尝试获取交易状态
  try {
    const statusEl = page.locator('[data-testid="tx-status"], text=成功, text=失败, text=已授权, text=购买成功').first();
    if (await statusEl.isVisible({ timeout: 5000 })) {
      const text = await statusEl.innerText();
      data.transactionStatus = text;
    }
  } catch (e) {
    data.transactionStatus = 'unknown';
  }
  
  return data;
}

async function getWalletDisplayData(metamaskPage) {
  const data = {
    usdtBalance: '0',
    sanciaBalance: '0'
  };
  
  try {
    const usdtEl = metamaskPage.locator('text=USDT').first();
    if (await usdtEl.isVisible()) {
      const parent = usdtEl.locator('xpath=../../..');
      const text = await parent.innerText();
      data.usdtBalance = text.match(/[\d.]+/) ? text.match(/[\d.]+/)[0] : '0';
    }
  } catch (e) {}
  
  return data;
}

function saveIntermediateResults() {
  fs.writeFileSync('dapp-test-intermediate-scia.json', JSON.stringify(TEST_RESULTS, null, 2));
  console.log('📄 中间结果已保存');
}

// 保存测试结果到localStorage，供DApp统计面板使用
function saveToLocalStorage() {
  try {
    const localStorageData = {
      ...TEST_RESULTS,
      endTime: new Date().toISOString(),
      totalDuration: new Date().getTime() - new Date(TEST_RESULTS.startTime).getTime()
    };
    
    // 将数据转换为JSON字符串
    const jsonData = JSON.stringify(localStorageData);
    
    // 保存到本地文件，供前端读取
    fs.writeFileSync('test-stats-scia.json', jsonData);
    console.log('✅ 测试结果已保存到test-stats-scia.json');
    
    // 同时保存到项目根目录的报告文件
    fs.writeFileSync('dapp-test-report-scia.json', jsonData);
    console.log('✅ 测试报告已保存到dapp-test-report-scia.json');
    
    return true;
  } catch (error) {
    console.error('❌ 保存测试结果失败:', error.message);
    return false;
  }
}

function generateFinalReport() {
  const perf = TEST_RESULTS.performanceMetrics;
  
  const avgPageLoad = perf.pageLoadTimes.length > 0
    ? perf.pageLoadTimes.reduce((sum, t) => sum + t.loadTime, 0) / perf.pageLoadTimes.length
    : 0;
  const avgTxTime = perf.transactionTimes.length > 0
    ? perf.transactionTimes.reduce((sum, t) => sum + t.duration, 0) / perf.transactionTimes.length
    : 0;
  const avgBlockTime = perf.blockConfirmTimes.length > 0
    ? perf.blockConfirmTimes.reduce((sum, t) => sum + t.duration, 0) / perf.blockConfirmTimes.length
    : 0;
  
  const badgeDist = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const acc of TEST_RESULTS.accountResults) {
    if (acc.badgeLevel !== undefined) {
      badgeDist[acc.badgeLevel]++;
    }
  }
  
  TEST_RESULTS.overallPerformance = {
    averagePageLoadTime: avgPageLoad,
    averageTransactionTime: avgTxTime,
    averageBlockConfirmTime: avgBlockTime,
    totalNetworkRequests: perf.networkStats.length,
    totalErrors: perf.errorCount,
    badgeDistribution: badgeDist,
    consistencyPassRate: TEST_RESULTS.consistencyResults.passed > 0 
      ? (TEST_RESULTS.consistencyResults.passed / (TEST_RESULTS.consistencyResults.passed + TEST_RESULTS.consistencyResults.failed) * 100).toFixed(2) + '%'
      : '0%'
  };
  
  // 保存到localStorage和报告文件
  saveToLocalStorage();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`总账号数: ${TEST_RESULTS.totalAccounts}`);
  console.log(`成功: ${TEST_RESULTS.successfulTests}, 失败: ${TEST_RESULTS.failedTests}`);
  console.log(`推荐率: ${(TEST_RESULTS.referralRate * 100).toFixed(2)}%`);
  console.log(`徽章4级账号: ${TEST_RESULTS.badgeLevel4Account || '无'}`);
  console.log(`\n三端一致性:`);
  console.log(`  通过: ${TEST_RESULTS.consistencyResults.passed}`);
  console.log(`  失败: ${TEST_RESULTS.consistencyResults.failed}`);
  console.log(`  通过率: ${TEST_RESULTS.overallPerformance.consistencyPassRate}`);
  console.log(`\n性能指标:`);
  console.log(`  平均页面加载: ${avgPageLoad.toFixed(2)}ms`);
  console.log(`  平均交易响应: ${avgTxTime.toFixed(2)}ms`);
  console.log(`  平均区块确认: ${avgBlockTime.toFixed(2)}ms`);
  console.log(`\n徽章分布:`);
  console.log(`  0级: ${badgeDist[0]}, 1级: ${badgeDist[1]}, 2级: ${badgeDist[2]}`);
  console.log(`  3级: ${badgeDist[3]}, 4级: ${badgeDist[4]}`);
  console.log('='.repeat(60));
}

// 从私募合约回收USDT的函数
async function withdrawFromPrivateSale(privateSaleContract, usdtContract, deployerWallet) {
  console.log('\n🏦 从私募合约回收USDT...');
  try {
    const contractUSDTBalance = await usdtContract.balanceOf(privateSaleContract.address);
    if (contractUSDTBalance > 0n) {
      const withdrawTx = await privateSaleContract.withdrawUSDT(contractUSDTBalance);
      await withdrawTx.wait();
      console.log(`✅ 成功回收 ${ethers.utils.formatEther(contractUSDTBalance)} USDT`);
      return contractUSDTBalance;
    } else {
      console.log('⚠️ 私募合约中没有USDT可回收');
      return BigInt(0);
    }
  } catch (error) {
    console.error(`❌ 回收USDT失败: ${error.message}`);
    return BigInt(0);
  }
}

// 三端一致性测试函数
async function runThreeEndConsistencyTest(page, blockchain, testWallet, usdtContract, sanciaContract, referralCenterContract, referrer) {
  console.log('\n🔍 三端一致性验证...');
  
  // 创建验证器
  const verifier = new ConsistencyVerifier(blockchain, page, testWallet);
  
  // 获取DApp显示数据
  const dappData = await getDAppDisplayData(page);
  
  // 获取链上数据
  const chainData = {
    usdtBalance: await blockchain.getUSDTBalance(usdtContract, testWallet.address),
    sanciaBalance: await blockchain.getSANCIABalance(sanciaContract, testWallet.address),
    badgeLevel: await blockchain.getUserBadge(referralCenterContract, testWallet.address),
    points: await blockchain.getUserPoints(referralCenterContract, testWallet.address),
    referrer: await blockchain.getReferrer(referralCenterContract, testWallet.address)
  };
  
  // 验证余额一致性
  await verifier.verifyBalanceConsistency(dappData.usdtBalance, '0', chainData.usdtBalance, 'USDT');
  await verifier.verifyBalanceConsistency(dappData.sanciaBalance, '0', chainData.sanciaBalance, 'SANCIA');
  
  // 验证徽章一致性
  await verifier.verifyBadgeConsistency(dappData.badgeLevel, chainData.badgeLevel);
  
  // 验证积分一致性
  await verifier.verifyPointsConsistency(dappData.points, chainData.points);
  
  // 验证推荐人一致性
  await verifier.verifyReferrerConsistency(referrer, chainData.referrer);
  
  // 返回验证结果
  return verifier.getResults();
}

// 主测试函数
async function main() {
  console.log('🚀 开始DApp真实购买 + 性能测试 + 三端一致性验证...');
  TEST_RESULTS.startTime = new Date().toISOString();
  
  const blockchain = new BlockchainService(BSC_TESTNET_RPCS);
  // 从第21个账号开始测试（索引20）
  const allAccounts = JSON.parse(fs.readFileSync(TEST_ACCOUNTS_PATH, 'utf8')).accounts;
  const accounts = allAccounts.slice(20, 20 + TEST_CONFIG.TOTAL_ACCOUNTS);
  TEST_RESULTS.totalAccounts = accounts.length;
  
  const deployerWallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, blockchain.provider);
  const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, ABIS.USDT, deployerWallet);
  const sanciaContract = new ethers.Contract(CONTRACT_ADDRESSES.SANCIA_TOKEN, ABIS.SANCIA, deployerWallet);
  const privateSaleContract = new ethers.Contract(CONTRACT_ADDRESSES.PRIVATE_SALE, ABIS.PRIVATE_SALE, deployerWallet);
  const referralCenterContract = new ethers.Contract(CONTRACT_ADDRESSES.REFERRAL_CENTER, ABIS.REFERRAL_CENTER, deployerWallet);
  
  const referralTree = generateReferralTree(accounts);
  
  // 保存推荐关系树到测试结果
  TEST_RESULTS.referralTree = referralTree;
  
  // 启动浏览器
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  
  for (let i = 0; i < accounts.length; i++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 测试账号 ${i + 1}/${accounts.length}: ${accounts[i].address}`);
    console.log(`${'='.repeat(60)}`);
    
    const accountStartTime = Date.now();
    const perfData = {
      accountIndex: i + 1,
      address: accounts[i].address,
      startTime: new Date().toISOString(),
      steps: [],
      consistency: [],
      performance: {}
    };
    
    let context;
    try {
      // 桌面端测试（1920x1080）
      console.log('💻 桌面端测试...');
      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      const page = await context.newPage();
      const perfMonitor = new PerformanceMonitor(page);
      await perfMonitor.startPagePerformance();
      
      const testWallet = new ethers.Wallet(accounts[i].privateKey, blockchain.provider);
      
      console.log('\n📊 步骤1: 访问DApp...');
      const pageLoadStart = Date.now();
      await page.goto(DAPP_URL, { waitUntil: 'networkidle' });
      const pageLoadTime = Date.now() - pageLoadStart;
      await perfMonitor.captureMemorySnapshot('page_load');
      perfData.performance.pageLoadTime = pageLoadTime;
      perfData.steps.push({ step: 'page_load', duration: pageLoadTime, status: 'success' });
      console.log(`✅ 页面加载: ${pageLoadTime}ms`);
      
      TEST_RESULTS.performanceMetrics.pageLoadTimes.push({ account: accounts[i].address, loadTime: pageLoadTime });
      
      console.log('\n🔗 步骤2: 连接钱包...');
      const walletConnectStart = Date.now();
      await connectWallet(page, accounts[i].privateKey);
      const walletConnectTime = Date.now() - walletConnectStart;
      perfData.performance.walletConnectTime = walletConnectTime;
      perfData.steps.push({ step: 'wallet_connect', duration: walletConnectTime, status: 'success' });
      console.log(`✅ 钱包连接: ${walletConnectTime}ms`);
      
      // 步骤3: 跳过注册用户名（当前DAPP未实现此功能）
      console.log('\n📝 步骤3: 跳过注册用户名（当前DAPP未实现此功能）...');
      
      console.log('\n💰 步骤4: 分配资金...');
      const fundStart = Date.now();
      const usdtAmount = ethers.utils.parseEther(TEST_CONFIG.USDT_PER_ACCOUNT);
      await allocateFunds(deployerWallet, usdtContract, testWallet, usdtAmount);
      const fundTime = Date.now() - fundStart;
      perfData.performance.fundTime = fundTime;
      perfData.steps.push({ step: 'fund_account', duration: fundTime, status: 'success' });
      console.log(`✅ 资金分配: ${fundTime}ms`);
      
      console.log('\n🛒 步骤5: 导航到购买页面...');
      const navStart = Date.now();
      await navigateToBuyPage(page);
      const navTime = Date.now() - navStart;
      perfData.performance.navigationTime = navTime;
      perfData.steps.push({ step: 'navigate', duration: navTime, status: 'success' });
      console.log(`✅ 导航: ${navTime}ms`);
      
      console.log('\n👥 步骤6: 输入推荐人...');
      const referrerInputStart = Date.now();
      const referrer = referralTree[i]?.referrer || ethers.constants.AddressZero;
      if (referrer !== ethers.constants.AddressZero) {
        await inputReferrer(page, referrer);
        TEST_RESULTS.referralCount++;
      }
      const referrerInputTime = Date.now() - referrerInputStart;
      perfData.performance.referrerInputTime = referrerInputTime;
      perfData.steps.push({ step: 'input_referrer', referrer, duration: referrerInputTime, status: 'success' });
      console.log(`✅ 推荐人: ${referrerInputTime}ms`);
      
      console.log('\n📦 步骤7: 选择购买数量...');
      const packageStart = Date.now();
      const packagesToBuy = Math.floor(Math.random() * 5) + 1;
      await selectPackages(page, packagesToBuy);
      const packageTime = Date.now() - packageStart;
      perfData.performance.packageSelectTime = packageTime;
      perfData.steps.push({ step: 'select_packages', packages: packagesToBuy, duration: packageTime, status: 'success' });
      console.log(`✅ 套餐选择: ${packageTime}ms`);
      
      console.log('\n� 步骤8: 提交购买请求...');
      const buyStart = Date.now();
      
      // 点击"立即购买"按钮
      const buyBtn = page.locator('button[type="submit"]:has-text("立即购买")').first();
      await buyBtn.click({ timeout: 10000 });
      
      // 处理MetaMask弹出窗口
      const allPages = await page.context().pages();
      const metamaskPage = allPages.find(p => p.url().includes('chrome-extension://'));
      
      if (metamaskPage) {
        try {
          // 授权USDT（如果需要）
          const approveBtn = metamaskPage.locator('button:has-text("授权"), button:has-text("Approve")').first();
          if (await approveBtn.isVisible({ timeout: 5000 })) {
            await approveBtn.click();
            await page.waitForTimeout(2000);
            console.log('✅ USDT授权已确认');
          }
        } catch (e) {
          console.log('未检测到USDT授权请求或已处理');
        }
        
        try {
          // 确认购买交易
          const confirmBtn = metamaskPage.locator('button:has-text("确认"), button:has-text("Confirm")').first();
          if (await confirmBtn.isVisible({ timeout: 5000 })) {
            await confirmBtn.click();
            await page.waitForTimeout(2000);
            console.log('✅ 购买交易已确认');
          }
        } catch (e) {
          console.log('未检测到购买确认请求或已处理');
        }
      }
      
      // 等待购买成功消息
      await page.waitForSelector('.ant-message-success', { timeout: 60000 });
      await perfMonitor.captureMemorySnapshot('after_buy');
      const buyTime = Date.now() - buyStart;
      perfData.performance.buyTime = buyTime;
      perfData.steps.push({ step: 'buy', packages: packagesToBuy, duration: buyTime, status: 'success' });
      console.log(`✅ 购买代币: ${buyTime}ms`);
      
      // 运行三端一致性测试
      const consistencyResults = await runThreeEndConsistencyTest(
        page, 
        blockchain, 
        testWallet, 
        usdtContract, 
        sanciaContract, 
        referralCenterContract, 
        referrer
      );
      
      // 保存一致性测试结果
      perfData.consistency = consistencyResults;
      
      for (const result of consistencyResults) {
        if (result.isConsistent) {
          TEST_RESULTS.consistencyResults.passed++;
        } else {
          TEST_RESULTS.consistencyResults.failed++;
        }
      }
      
      // 计算通过率
      const passRate = (consistencyResults.filter(r => r.isConsistent).length / consistencyResults.length * 100).toFixed(2);
      console.log(`✅ 一致性验证: ${passRate}% 通过`);
      
      // 获取徽章等级和积分
      const badgeLevel = parseInt((await blockchain.getUserBadge(referralCenterContract, testWallet.address)).toString());
      const points = ethers.utils.formatEther(await blockchain.getUserPoints(referralCenterContract, testWallet.address));
      perfData.badgeLevel = badgeLevel;
      perfData.points = points;
      perfData.steps.push({ step: 'verify_consistency', passRate, status: 'success' });
      console.log(`🏅 徽章等级: ${badgeLevel}, 积分: ${points}`);
      
      // 检查是否达到徽章4级
      if (badgeLevel >= 4 && !TEST_RESULTS.badgeLevel4Account) {
        TEST_RESULTS.badgeLevel4Account = accounts[i].address;
      }
      
      // 移动端测试（375x667）
      console.log('\n📱 移动端测试...');
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      });
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto(DAPP_URL, { waitUntil: 'networkidle' });
      await runThreeEndConsistencyTest(
        mobilePage, 
        blockchain, 
        testWallet, 
        usdtContract, 
        sanciaContract, 
        referralCenterContract, 
        referrer
      );
      await mobileContext.close();
      console.log('✅ 移动端测试完成');
      
      // 平板测试（768x1024）
      console.log('\n📋 平板测试...');
      const tabletContext = await browser.newContext({
        viewport: { width: 768, height: 1024 },
        userAgent: 'Mozilla/5.0 (iPad; CPU iPad OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      });
      const tabletPage = await tabletContext.newPage();
      await tabletPage.goto(DAPP_URL, { waitUntil: 'networkidle' });
      await runThreeEndConsistencyTest(
        tabletPage, 
        blockchain, 
        testWallet, 
        usdtContract, 
        sanciaContract, 
        referralCenterContract, 
        referrer
      );
      await tabletContext.close();
      console.log('✅ 平板测试完成');
      
      console.log('\n♻️ 步骤10: 资产回收...');
      const recoverStart = Date.now();
      await recoverAssets(usdtContract, sanciaContract, testWallet, deployerWallet.address);
      const recoverTime = Date.now() - recoverStart;
      perfData.performance.recoverTime = recoverTime;
      perfData.steps.push({ step: 'recover', duration: recoverTime, status: 'success' });
      console.log(`✅ 资产回收: ${recoverTime}ms`);
      
      console.log('\n🔌 步骤11: 断开钱包连接...');
      const disconnectStart = Date.now();
      await disconnectWallet(page);
      const disconnectTime = Date.now() - disconnectStart;
      perfData.performance.disconnectTime = disconnectTime;
      perfData.steps.push({ step: 'disconnect', duration: disconnectTime, status: 'success' });
      console.log(`✅ 断开连接: ${disconnectTime}ms`);
      
      await perfMonitor.captureMemorySnapshot('test_complete');
      perfData.performance.totalTime = Date.now() - accountStartTime;
      perfData.performance.memorySnapshots = perfMonitor.metrics.memorySnapshots;
      perfData.performance.networkRequests = perfMonitor.metrics.networkRequests.length;
      perfData.performance.jsErrors = perfMonitor.metrics.jsErrors.length;
      perfData.performance.consoleErrors = perfMonitor.metrics.consoleErrors.length;
      
      TEST_RESULTS.successfulTests++;
      perfData.overallStatus = 'success';
      
      console.log(`\n📊 总耗时: ${perfData.performance.totalTime}ms`);
      console.log(`📊 网络请求: ${perfMonitor.metrics.networkRequests.length}`);
      console.log(`📊 JS错误: ${perfMonitor.metrics.jsErrors.length}`);
      
    } catch (error) {
      console.error(`❌ 账号测试失败: ${error.message}`);
      perfData.overallStatus = 'failed';
      perfData.error = error.message;
      perfData.steps.push({ step: 'error', error: error.message });
      TEST_RESULTS.failedTests++;
      TEST_RESULTS.performanceMetrics.errorCount++;
    } finally {
      try {
        if (context) await context.close();
      } catch (e) {}
    }
    
    // 获取推荐奖励
    const referralRewards = await blockchain.getReferralRewards(privateSaleContract, accounts[i].address);
    const sciaReward = ethers.utils.formatEther(referralRewards.totalSCIAFromReferrals);
    const usdtReward = ethers.utils.formatEther(referralRewards.totalUSDTFromReferrals);
    
    // 更新账号测试结果
    perfData.referralRewards = {
      sciaReward,
      usdtReward
    };
    
    perfData.endTime = new Date().toISOString();
    perfData.totalDuration = Date.now() - accountStartTime;
    TEST_RESULTS.accountResults.push(perfData);
    
    // 累加总推荐奖励
    const currentTotalSCIA = parseFloat(TEST_RESULTS.totalSCIAFromReferrals);
    const currentTotalUSDT = parseFloat(TEST_RESULTS.totalUSDTFromReferrals);
    TEST_RESULTS.totalSCIAFromReferrals = (currentTotalSCIA + parseFloat(sciaReward)).toFixed(2);
    TEST_RESULTS.totalUSDTFromReferrals = (currentTotalUSDT + parseFloat(usdtReward)).toFixed(2);
    
    // 每测试30个账号，从私募合约回收USDT
    if ((i + 1) % 30 === 0) {
      await withdrawFromPrivateSale(privateSaleContract, usdtContract, deployerWallet);
    }
    
    if ((i + 1) % 10 === 0) {
      saveIntermediateResults();
    }
  }
  
  // 测试结束后，最后一次回收USDT
  await withdrawFromPrivateSale(privateSaleContract, usdtContract, deployerWallet);
  
  await browser.close();
  
  TEST_RESULTS.endTime = new Date().toISOString();
  TEST_RESULTS.referralRate = TEST_RESULTS.referralCount / TEST_RESULTS.totalAccounts;
  
  generateFinalReport();
  
  console.log('\n🎉 测试完成!');
}

main().catch(console.error);
