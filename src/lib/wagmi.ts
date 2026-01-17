import { http, createConfig } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  trustWallet,
  rainbowWallet,
  binanceWallet,
  tokenPocketWallet,
  safepalWallet,
  okxWallet,
  imTokenWallet,
} from '@rainbow-me/rainbowkit/wallets';

// 创建Wagmi配置 - 适配AVE浏览器等本地钱包
const projectId = ''; // 使用空projectId避免远程调用

// 定义钱包列表，优先支持本地注入钱包
const wallets = [
  { 
    groupName: '推荐钱包', 
    wallets: [
      metaMaskWallet, // 优先支持MetaMask兼容的本地钱包（包括AVE浏览器）
      trustWallet,
      rainbowWallet,
      binanceWallet, // 币安钱包
      tokenPocketWallet, // TP钱包
      safepalWallet, // SafePal钱包
      okxWallet, // OKX钱包
      imTokenWallet, // imToken钱包
    ] 
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
