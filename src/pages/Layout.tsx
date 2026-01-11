import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FundOutlined, 
  BarChartOutlined, 
  TeamOutlined, 
  ShoppingCartOutlined, 
  PictureOutlined, 
  UserOutlined, 
  TranslationOutlined, 
  ScanOutlined 
} from '@ant-design/icons';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { setShowRegistrationModal, setUserRegistered, setUserInfo, resetUserState } from '../features/user';

const Layout: React.FC = () => {
  const navItems = [
    { path: '/buy', text: '私募', icon: <FundOutlined /> },
    { path: '/data', text: '数据', icon: <BarChartOutlined /> },
    { path: '/community', text: '社区', icon: <TeamOutlined /> },
    { path: '/mall', text: '商城', icon: <ShoppingCartOutlined /> },
    { path: '/nft', text: 'NFT', icon: <PictureOutlined /> },
    { path: '/me', text: '我', icon: <UserOutlined /> },
    { path: '/statistics', text: '统计', icon: <BarChartOutlined /> }
  ];

  const { address, isConnected } = useAccount();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const [showScanner, setShowScanner] = useState(false);
  
  const { isRegistered } = useSelector((state: RootState) => state.user);

  // 检查用户注册状态
  useEffect(() => {
    if (isConnected && address) {
      // 直接调用API获取用户信息，检查是否已注册
      const checkUserRegistration = async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/users/${address}`);
          const userData = await response.json();
          
          if (userData.username) {
            // 用户已注册，获取用户信息
            dispatch(setUserRegistered(true));
            dispatch(setUserInfo({
              username: userData.username,
              avatar: userData.avatar,
              createdAt: userData.registeredAt,
              lastProfileUpdate: userData.lastProfileUpdateAt
            }));
          } else {
            // 用户未注册
            dispatch(setUserRegistered(false));
            // 自动打开注册模态框
            dispatch(setShowRegistrationModal(true));
          }
        } catch (error) {
          console.error('检查用户注册状态失败:', error);
        }
      };
      
      checkUserRegistration();
    } else {
      // 钱包断开连接，重置用户状态
      dispatch(resetUserState());
    }
  }, [isConnected, address, dispatch]);
  
  // 处理功能按钮点击，未注册用户引导注册
  const handleFeatureClick = (e: React.MouseEvent) => {
    if (!isConnected) {
      message.info('请先连接钱包');
      e.preventDefault();
      return;
    }
    
    if (!isRegistered) {
      message.info('请先完成注册');
      dispatch(setShowRegistrationModal(true));
      e.preventDefault();
      return;
    }
  };

  // 处理二维码扫描成功
  const handleScanSuccess = (result: string) => {
    message.success('扫描成功');
    console.log('二维码扫描结果:', result);
    
    // 可以根据扫描结果进行不同的处理
    // 1. 如果是 URL，可以导航到该 URL
    if (result.startsWith('http')) {
      window.location.href = result;
    }
    // 2. 如果是钱包地址，可以显示或使用该地址
    else if (/^0x[a-fA-F0-9]{40}$/.test(result)) {
      message.info(`扫描到钱包地址: ${result}`);
      // 可以在这里添加复制到剪贴板或其他处理逻辑
    }
    // 3. 其他类型的数据可以根据需求处理
    else {
      message.info(`扫描结果: ${result}`);
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
          <div 
            style={{
              width: '24px',
              height: '24px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onClick={() => setShowScanner(true)}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <ScanOutlined />
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
      
      {/* 二维码扫描器 - 简化版本，仅显示提示 */}
      {showScanner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 200
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>二维码扫描器</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>该功能正在开发中</p>
            <button 
              onClick={() => setShowScanner(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1890ff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;