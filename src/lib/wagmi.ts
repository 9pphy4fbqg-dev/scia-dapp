import { http, createConfig } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { injected } from '@wagmi/connectors';

// 创建连接器 - 只使用本地注入钱包（兼容AVE浏览器）
const connectors = [
  injected({
    shimDisconnect: true,
  }),
];

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
