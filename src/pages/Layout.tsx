import React, { useState, useEffect, useRef } from 'react';
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
import { BrowserMultiFormatReader } from '@zxing/library';
import { useLanguage } from '../contexts/LanguageContext';

const Layout: React.FC = () => {
  const { currentLanguage, setLanguage, t } = useLanguage();
  
  const navItems = [
    { path: '/buy', text: t('buy'), icon: <FundOutlined /> },
    { path: '/data', text: t('data'), icon: <BarChartOutlined /> },
    { path: '/community', text: t('community'), icon: <TeamOutlined /> },
    { path: '/mall', text: t('mall'), icon: <ShoppingCartOutlined /> },
    { path: '/nft', text: t('nft'), icon: <PictureOutlined /> },
    { path: '/me', text: t('me'), icon: <UserOutlined /> }
  ];
  
  const { isConnected } = useAccount();
  const location = useLocation();
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  
  // 切换语言
  const toggleLanguage = () => {
    setLanguage(currentLanguage === 'zh' ? 'en' : 'zh');
  };

  // 处理功能按钮点击，仅检查钱包连接状态
  const handleFeatureClick = (e: React.MouseEvent) => {
    if (!isConnected) {
      message.info(t('connectWallet'));
      e.preventDefault();
      return;
    }
  };

  // 初始化扫描器
  const initializeScanner = () => {
    if (scannerRef.current) {
      return scannerRef.current;
    }
    
    const scanner = new BrowserMultiFormatReader();
    scannerRef.current = scanner;
    return scanner;
  };

  // 开始扫描
  const startScanning = async () => {
    if (!videoRef.current) return;
    
    try {
      setIsScanning(true);
      const scanner = initializeScanner();
      
      // 获取摄像头流
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // 设置视频流
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      // 开始识别二维码 - 使用连续扫描的方式
      const decodeLoop = async () => {
        if (!isScanning || !videoRef.current) return;
        
        try {
          // 单次识别
          const scanResult = await scanner.decodeFromVideoElement(videoRef.current);
          if (scanResult) {
            // 使用正确的方法获取解码文本
            const decodedText = scanResult.getText();
            handleScanResult(decodedText);
            return;
          }
        } catch (error: any) {
          // 忽略未找到二维码的错误，继续扫描
          if (error && error.message && !error.message.includes('NotFoundException')) {
            console.error('扫描错误:', error);
          }
        }
        
        // 继续扫描
        if (isScanning) {
          requestAnimationFrame(decodeLoop);
        }
      };
      
      // 启动扫描循环
      decodeLoop();
    } catch (error: any) {
      console.error('Cannot access camera:', error);
      message.error(t('cannotAccessCamera'));
      setIsScanning(false);
      setScanModalVisible(false);
    }
  };

  // 停止扫描
  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stopContinuousDecode();
      scannerRef.current.reset();
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  // 处理扫描结果
  const handleScanResult = (result: string) => {
    try {
      // 停止扫描
      stopScanning();
      
      // 尝试解析扫描结果
      const parsedResult = new URL(result);
      const ref = parsedResult.searchParams.get('ref');
      if (ref) {
        message.success(t('scanSuccessReferrer', { ref }));
        // 跳转到购买页面并自动填充推荐人
        window.location.href = `/buy?ref=${ref}`;
      } else {
        message.success(t('scanResult', { result }));
        // 关闭模态框
        setScanModalVisible(false);
      }
    } catch {
      // 如果不是URL，直接显示结果
      message.success(t('scanResult', { result }));
      // 关闭模态框
      setScanModalVisible(false);
    }
  };

  // 处理扫描按钮点击
  const handleScanClick = () => {
    setScanModalVisible(true);
  };

  // 关闭扫描模态框
  const handleScanModalClose = () => {
    stopScanning();
    setScanModalVisible(false);
  };

  // 当模态框打开时，开始扫描
  useEffect(() => {
    if (scanModalVisible) {
      startScanning();
    } else {
      stopScanning();
    }
    
    // 组件卸载时清理资源
    return () => {
      stopScanning();
    };
  }, [scanModalVisible]);

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
            <ScanOutlined onClick={handleScanClick} />
          </div>
          <div style={{ width: '24px', height: '24px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <TranslationOutlined onClick={toggleLanguage} />
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

      {/* 扫描二维码模态框 - 使用自定义div实现，与推荐树模态框样式一致 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: scanModalVisible ? 'flex' : 'none',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          width: '400px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          backgroundColor: '#000000',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 模态框头部 */}
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#000000',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ScanOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{t('scanQR')}</div>
            </div>
            <button 
              onClick={handleScanModalClose} 
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          
          {/* 模态框内容 */}
          <div style={{
            padding: '24px',
            backgroundColor: '#000000',
            overflowY: 'auto',
            flex: 1
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '16px'
            }}>
              {/* 真实扫描区域 */}
              <div style={{ 
                width: '300px', 
                height: '300px', 
                border: '2px solid #1890ff', 
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#000',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
                {/* 视频元素 */}
                <video
                  ref={videoRef}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  autoPlay
                  playsInline
                />
                
                {/* 扫描线动画 */}
                {isScanning && (
                  <div style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: '#1890ff',
                    animation: 'scan 2s infinite linear',
                    opacity: 0.7
                  }}></div>
                )}
                
                {/* 扫描框覆盖 */}
                <div style={{ 
                  position: 'absolute',
                  top: '25%',
                  left: '25%',
                  right: '25%',
                  bottom: '25%',
                  border: '2px solid #1890ff',
                  pointerEvents: 'none',
                  borderRadius: '8px'
                }}></div>
                
                {/* 扫描提示文字 */}
                {!isScanning && (
                  <div style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff', 
                    fontSize: '14px',
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    <div>
                      <ScanOutlined style={{ fontSize: '48px', marginBottom: '8px', display: 'block', color: '#1890ff' }} />
                      <div>{t('initializingCamera')}</div>
                      <div style={{ fontSize: '12px', marginTop: '4px', color: 'rgba(255, 255, 255, 0.7)' }}>{t('allowCameraAccess')}</div>
                    </div>
                  </div>
                )}
                
                {/* 扫描样式 */}
                <style>{`
                  @keyframes scan {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(300px); }
                  }
                `}</style>
              </div>
              
              {/* 扫描状态提示 */}
              {isScanning && (
                <div style={{ color: '#1890ff', fontSize: '14px' }}>
                  {t('scanningQR')}
                </div>
              )}
              
              {/* 手动输入选项 */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <Link 
                  to="/buy" 
                  style={{ color: '#1890ff', textDecoration: 'underline' }}
                  onClick={handleScanModalClose}
                >
                  {t('manualInput')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;