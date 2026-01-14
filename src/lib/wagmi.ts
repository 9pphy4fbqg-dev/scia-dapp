import { http, createConfig } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  trustWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

// 创建Wagmi配置，只使用BSC测试网
const projectId = '1a75652e10e3295640037a5b4e4b5bc0'; // 使用默认的WalletConnect项目ID

// 定义钱包列表
const wallets = [
  { groupName: 'Recommended', wallets: [metaMaskWallet, trustWallet, rainbowWallet] },
  { groupName: 'Other', wallets: [coinbaseWallet, walletConnectWallet] },
];

// 创建连接器
const connectors = connectorsForWallets(wallets, {
  appName: 'SCIA Dapp',
  projectId,
});

// 使用可用的BSC测试网RPC节点
export const config = createConfig({
  chains: [bscTestnet],
  connectors,
  transports: {
    [bscTestnet.id]: http('https://bsc-testnet-rpc.publicnode.com'),
  },
  ssr: true,
});
