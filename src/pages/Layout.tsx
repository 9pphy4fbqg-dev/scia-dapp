import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FundOutlined, 
  BarChartOutlined, 
  TeamOutlined, 
  ShoppingCartOutlined, 
  PictureOutlined, 
  UserOutlined, 
  TranslationOutlined 
} from '@ant-design/icons';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { message } from 'antd';

const Layout: React.FC = () => {
  const navItems = [
    { path: '/buy', text: '私募', icon: <FundOutlined /> },
    { path: '/data', text: '数据', icon: <BarChartOutlined /> },
    { path: '/community', text: '社区', icon: <TeamOutlined /> },
    { path: '/mall', text: '商城', icon: <ShoppingCartOutlined /> },
    { path: '/nft', text: 'NFT', icon: <PictureOutlined /> },
    { path: '/me', text: '我', icon: <UserOutlined /> }
  ];

  const { isConnected } = useAccount();
  const location = useLocation();

  // 处理功能按钮点击，仅检查钱包连接状态
  const handleFeatureClick = (e: React.MouseEvent) => {
    if (!isConnected) {
      message.info('请先连接钱包');
      e.preventDefault();
      return;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000000', color: '#ffffff' }}>
      {/* 顶部导航栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '24px', height: '24px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <TranslationOutlined />
          </div>
        </div>
        
        {/* 放大彩色LOGO文字一倍并加粗 */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          fontSize: '32px',
          fontWeight: 'bold',
          lineHeight: '1'
        }}>
          <span style={{ color: '#FF0000', fontSize: '32px', fontWeight: 'bold', display: 'inline-block' }}>S</span>
          <span style={{ color: '#FFA500', fontSize: '32px', fontWeight: 'bold', display: 'inline-block' }}>a</span>
          <span style={{ color: '#FFFF00', fontSize: '32px', fontWeight: 'bold', display: 'inline-block' }}>n</span>
          <span style={{ color: '#008000', fontSize: '32px', fontWeight: 'bold', display: 'inline-block' }}>c</span>
          <span style={{ color: '#00FFFF', fontSize: '32px', fontWeight: 'bold', display: 'inline-block' }}>i</span>
          <span style={{ color: '#0000FF', fontSize: '32px', fontWeight: 'bold', display: 'inline-block' }}>a</span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '150px',
          justifyContent: 'flex-end'
        }}>
          {/* 使用RainbowKit的ConnectButton组件 */}
          <ConnectButton />
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div style={{ flex: 1, padding: '16px', backgroundColor: '#000000' }}>
        <Outlet />
      </div>
      
      {/* 底部导航栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        bottom: 0,
        zIndex: 100
      }}>
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: location.pathname === item.path ? '#ffffff' : '#666666',
              textDecoration: 'none',
              fontSize: '12px',
              padding: '4px',
              cursor: 'pointer'
            }}
            onClick={handleFeatureClick}
          >
            <div style={{ fontSize: '18px', marginBottom: '2px' }}>{item.icon}</div>
            <span>{item.text}</span>
          </Link>
        ))}
      </div>
      

    </div>
  );
};

export default Layout;