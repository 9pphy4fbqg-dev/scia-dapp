import { http, createConfig } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  trustWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
  binanceWallet,
  tokenPocketWallet,
  safepalWallet,
  okxWallet,
  imTokenWallet,
} from '@rainbow-me/rainbowkit/wallets';

// 创建Wagmi配置
const projectId = '1a75652e10e3295640037a5b4e4b5bc0'; // 使用默认的WalletConnect项目ID

// 定义钱包列表，添加常用钱包
const wallets = [
  { 
    groupName: '推荐钱包', 
    wallets: [
      metaMaskWallet, 
      trustWallet, 
      rainbowWallet,
      binanceWallet, // 币安钱包
      tokenPocketWallet, // TP钱包
      safepalWallet, // SafePal钱包
      okxWallet, // OKX钱包
      imTokenWallet, // imToken钱包
      walletConnectWallet, // 支持其他钱包，包括AVE钱包等
    ] 
  },
  {
    groupName: '其他钱包',
    wallets: [coinbaseWallet],
  },
];

// 创建连接器
const connectors = connectorsForWallets(wallets, {
  appName: 'SCIA Dapp',
  projectId,
});

// 使用BSC测试网和主网配置
export const config = createConfig({
  chains: [bscTestnet, bsc],
  connectors,
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
    [bsc.id]: http('https://bsc-dataseed.binance.org/'),
  },
  ssr: false,
});
