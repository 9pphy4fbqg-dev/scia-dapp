const Web3 = require('web3');
const axios = require('axios');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 私募合约ABI（仅包含需要监听的事件）
const privateSaleAbi = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "referrer", "type": "address" },
      { "indexed": false, "name": "sciaReward", "type": "uint256" },
      { "indexed": false, "name": "usdtReward", "type": "uint256" }
    ],
    "name": "ReferralRewardDistributed",
    "type": "event"
  }
];

// 配置
const config = {
  // 区块链节点URL
  blockchainNodeUrl: process.env.BLOCKCHAIN_NODE_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
  // 私募合约地址
  privateSaleContractAddress: process.env.PRIVATE_SALE_CONTRACT_ADDRESS || '0xf5753871068D76CFdb8f2c20b8cd0E6be5C9BC46',
  // 后端API URL
  backendApiUrl: process.env.BACKEND_API_URL || 'http://localhost:3001/api/users',
  // 事件监听的起始区块（0表示从创世区块开始）
  startBlock: 0,
  // 轮询间隔（毫秒）
  pollInterval: 5000
};

// 初始化Web3
const web3 = new Web3(config.blockchainNodeUrl);

// 创建私募合约实例
const privateSaleContract = new web3.eth.Contract(
  privateSaleAbi,
  config.privateSaleContractAddress
);

// 事件处理函数
const handleReferralReward = async (event) => {
  try {
    const { referrer, sciaReward, usdtReward } = event.returnValues;
    
    console.log(`\n=== 检测到推荐奖励事件 ===`);
    console.log(`推荐人地址: ${referrer}`);
    console.log(`SCIA奖励: ${sciaReward} wei`);
    console.log(`USDT奖励: ${usdtReward} wei`);
    
    // 调用后端API更新用户奖励
    const response = await axios.put(
      `${config.backendApiUrl}/${referrer}/rewards`,
      {
        sciaReward,
        usdtReward
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 200) {
      console.log(`✅ 奖励更新成功: ${referrer}`);
    } else {
      console.error(`❌ 奖励更新失败: ${response.status} - ${response.data.message}`);
    }
  } catch (error) {
    console.error(`❌ 处理推荐奖励事件失败: ${error.message}`);
    console.error(error.stack);
  }
};

// 启动事件监听
const startEventListener = () => {
  console.log('🚀 启动推荐奖励事件监听服务...');
  console.log(`📡 连接到区块链节点: ${config.blockchainNodeUrl}`);
  console.log(`📝 监听合约地址: ${config.privateSaleContractAddress}`);
  console.log(`⏱️  轮询间隔: ${config.pollInterval}ms`);
  
  // 监听ReferralRewardDistributed事件
  privateSaleContract.events.ReferralRewardDistributed({
    fromBlock: config.startBlock,
    toBlock: 'latest'
  })  
  .on('data', handleReferralReward)
  .on('error', (error) => {
    console.error(`❌ 事件监听发生错误: ${error.message}`);
    // 3秒后重新启动监听
    setTimeout(startEventListener, 3000);
  })
  .on('connected', (subscriptionId) => {
    console.log(`✅ 事件监听已连接，订阅ID: ${subscriptionId}`);
  });
};

// 启动服务
startEventListener();

// 定期检查服务状态
setInterval(() => {
  console.log('🔄 事件监听服务运行中...');
}, 60000);

// 处理进程终止
process.on('SIGINT', () => {
  console.log('\n🛑 收到终止信号，正在关闭事件监听服务...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在关闭事件监听服务...');
  process.exit(0);
});
