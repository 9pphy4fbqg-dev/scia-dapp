import { useEffect } from 'react';
import { useAccount, useChainId, useConnect } from 'wagmi';
import { useDispatch } from 'react-redux';
import { updateWalletStatus } from '../features/wallet/walletSlice';

const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const dispatch = useDispatch();
  const { connect, connectors } = useConnect();

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
      {isConnected ? (
        <div className="connected-wallet">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
      ) : (
        <button 
          className="connect-button" 
          onClick={() => connect({ connector: connectors[0] })}
        >
          连接钱包
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
