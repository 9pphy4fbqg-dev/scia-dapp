import { http, createConfig } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { injected, walletConnect, safe, coinbaseWallet } from 'wagmi/connectors';

// 创建Wagmi配置，只使用BSC测试网
export const config = createConfig({
  chains: [bscTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: 'YOUR_PROJECT_ID', // 请替换为您的WalletConnect项目ID
    }),
    coinbaseWallet({
      appName: 'SCIA Dapp',
    }),
    safe(),
  ],
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
  ssr: true,
});
