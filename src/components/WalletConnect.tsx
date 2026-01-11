import { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { useDispatch } from 'react-redux';
import { updateWalletStatus } from '../features/wallet/walletSlice';

const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const dispatch = useDispatch();

  // 监听钱包状态变化，同步到Redux store
  useEffect(() => {
    dispatch(
      updateWalletStatus({
        isConnected,
        address: address as string | null,
        chainId,
      })
    );
  }, [isConnected, address, chainId, dispatch]);

  return (
    <div className="wallet-connect-container">
      <ConnectButton
        showBalance={false}
        accountStatus="address"
        chainStatus="icon"
      />
    </div>
  );
};

export default WalletConnect;
