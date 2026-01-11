import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>SCIA Dapp</h1>
        </div>
        <div className="wallet-connect">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
