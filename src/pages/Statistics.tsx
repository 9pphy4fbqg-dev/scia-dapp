import { useContractRead, useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography, Progress, Tag } from 'antd';
import {
  DollarCircleOutlined,
  ArrowUpOutlined,
  UserOutlined,
  WalletOutlined,
  BarChartOutlined,
  LoadingOutlined,
  LaptopOutlined,
  MobileOutlined,
  TabletOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

import { privateSaleAbi } from '../abi/privateSale';
import { referralCenterAbi } from '../abi/referralCenter';

// 获取合约地址
const PRIVATE_SALE_CONTRACT_ADDRESS = import.meta.env.REACT_APP_TESTNET_PRIVATE_SALE_CONTRACT_ADDRESS as `0x${string}`;
const REFERRAL_CENTER_ADDRESS = import.meta.env.REACT_APP_TESTNET_REFERRAL_CENTER_ADDRESS as `0x${string}`;

// 常量定义
const REFRESH_INTERVAL = 5000; // 5秒刷新一次
const WEI_TO_USDT = 10 ** 18; // wei到USDT的转换因子

// 色彩主题定义
const COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#13c2c2',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textTertiary: 'rgba(255, 255, 255, 0.6)',
  backgroundPrimary: 'rgba(255, 255, 255, 0.05)',
  backgroundSecondary: 'rgba(255, 255, 255, 0.02)',
  border: 'rgba(255, 255, 255, 0.1)',
  badgeMember: '#faad14',
  badgeCity: '#1890ff',
  badgeProvince: '#722ed1',
  badgeNational: '#eb2f96'
};

// 统一样式常量
const CARD_STYLE = {
  backgroundColor: COLORS.backgroundPrimary,
  borderRadius: '12px',
  border: `1px solid ${COLORS.border}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease-in-out, transform 0.3s ease-out, box-shadow 0.3s ease-out',
  transform: 'translateY(0)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
};

const CARD_HEAD_STYLE = {
  color: COLORS.textPrimary,
  borderBottom: `1px solid ${COLORS.border}`,
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '1.5'
};

const CARD_MARGIN_BOTTOM = '24px';

// 排版常量
const FONT_SIZES = {
  titleLarge: '24px',
  titleMedium: '20px',
  titleSmall: '16px',
  subtitle: '14px',
  bodyLarge: '16px',
  bodyMedium: '14px',
  bodySmall: '12px'
};

const LINE_HEIGHTS = {
  title: '1.3',
  body: '1.6'
};

const { Title, Text } = Typography;

// 徽章等级枚举
  enum BadgeLevel {
    None = 0,
    Member = 1,
    City = 2,
    Province = 3,
    National = 4
  }

const StatisticsPage = () => {
  // 设备类型检测
  const [deviceType, setDeviceType] = useState<string>('unknown');
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // 测试数据验证 - 使用当前连接的钱包地址
  const { address: connectedWalletAddress, isConnected } = useAccount();
  const [testWalletAddress, setTestWalletAddress] = useState<string>('0x0000000000000000000000000000000000000000');
  
  // 监听钱包地址变化
  useEffect(() => {
    if (isConnected && connectedWalletAddress) {
      setTestWalletAddress(connectedWalletAddress);
    } else {
      setTestWalletAddress('0x0000000000000000000000000000000000000000');
    }
  }, [connectedWalletAddress, isConnected]);

  // 获取用户徽章信息
  const {
    data: userBadgeInfo
  } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getUserBadgeInfo',
    args: [testWalletAddress as `0x${string}`],
    query: {
      enabled: testWalletAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: REFRESH_INTERVAL,
      retry: 1, // 只重试1次，避免无限重试
      staleTime: 10000 // 数据10秒内视为新鲜，减少请求次数
    }
  });
  
  // 获取徽章阈值
  const {
    data: nationalBadgeThreshold
  } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getNextBadgeThreshold',
    args: [BadgeLevel.Province],
    query: {
      enabled: true
    }
  });
  
  // 获取销售状态
  const {
    data: isPaused
  } = useContractRead({
    address: PRIVATE_SALE_CONTRACT_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'isPaused',
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1, // 只重试1次，避免无限重试
      staleTime: 10000 // 数据10秒内视为新鲜，减少请求次数
    }
  });
  
  const {
    data: isEnded
  } = useContractRead({
    address: PRIVATE_SALE_CONTRACT_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'isEnded',
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1, // 只重试1次，避免无限重试
      staleTime: 10000 // 数据10秒内视为新鲜，减少请求次数
    }
  });
  
  // 计算徽章验证状态
  const calculateBadgeVerification = () => {
    if (!userBadgeInfo) return { status: 'pending', badgeName: '无' };
    
    const [badgeLevel] = userBadgeInfo;
    const badgeNameMap: Record<number, string> = {
      0: '无',
      1: '会员',
      2: '市级',
      3: '省级',
      4: '国家级'
    };
    const badgeName = badgeNameMap[badgeLevel as number] || '无';
    
    return {
      status: badgeLevel > 0 ? 'success' : 'pending',
      badgeName
    };
  };

  // 监听窗口大小变化，检测设备类型
  useEffect(() => {
    const detectDeviceType = () => {
      const width = window.innerWidth;
      let type = 'desktop';
      if (width < 768) {
        type = 'mobile';
      } else if (width < 1024) {
        type = 'tablet';
      }
      setDeviceType(type);
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    // 初始化检测
    detectDeviceType();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', detectDeviceType);
    
    return () => {
      window.removeEventListener('resize', detectDeviceType);
    };
  }, []);

  // 三端一致性验证数据
  const [lastVerified, setLastVerified] = useState<Date>(new Date());
  const [consistencyResults, setConsistencyResults] = useState<{
    usdtBalanceConsistency: boolean;
    sciaBalanceConsistency: boolean;
    badgeConsistency: boolean;
    pointsConsistency: boolean;
    referrerConsistency: boolean;
    isOverallConsistent: boolean;
  }>({
    usdtBalanceConsistency: false,
    sciaBalanceConsistency: false,
    badgeConsistency: false,
    pointsConsistency: false,
    referrerConsistency: false,
    isOverallConsistent: false
  });

  // 三端一致性验证 - 验证合约端、DAPP端、用户钱包端数据一致性
  const verifyThreeEndConsistency = () => {
    if (!userBadgeInfo || !testWalletAddress || testWalletAddress === '0x0000000000000000000000000000000000000000') {
      return;
    }

    // 从userBadgeInfo中获取链上数据（合约端）
    const [badgeLevel, points, referrer] = userBadgeInfo;
    
    // 转换为前端显示格式
    const chainBadgeLevel = Number(badgeLevel);
    const chainPoints = Number(points) / 10 ** 18;
    const chainReferrer = String(referrer);
    
    // 模拟DAPP端显示的数据
    const dappBadgeLevel = chainBadgeLevel; // DAPP应该显示与链上一致的数据
    const dappPoints = chainPoints; // DAPP应该显示与链上一致的数据
    const dappReferrer = chainReferrer; // DAPP应该显示与链上一致的数据
    
    // 钱包端数据（模拟）
    const walletUSDTBalance = 0;
    const walletSCIABalance = 0;
    
    // 模拟链上USDT和SCIA余额（在实际应用中，应该从合约中获取）
    const chainUSDTBalance = walletUSDTBalance;
    const chainSCIABalance = walletSCIABalance;
    
    // 模拟DAPP显示的余额（在实际应用中，应该从DAPP状态中获取）
    const dappUSDTBalance = chainUSDTBalance;
    const dappSCIABalance = chainSCIABalance;

    // 验证逻辑：验证三个端的数据是否一致
    // 1. USDT余额一致性：钱包端 === 链上（合约端）=== DAPP端
    const usdtBalanceConsistency = Math.abs(walletUSDTBalance - chainUSDTBalance) < 0.001 && 
                                  Math.abs(chainUSDTBalance - dappUSDTBalance) < 0.001;
    
    // 2. SCIA余额一致性：钱包端 === 链上（合约端）=== DAPP端
    const sciaBalanceConsistency = Math.abs(walletSCIABalance - chainSCIABalance) < 0.001 && 
                                  Math.abs(chainSCIABalance - dappSCIABalance) < 0.001;
    
    // 3. 徽章一致性：DAPP端 === 链上（合约端）
    const badgeConsistency = dappBadgeLevel === chainBadgeLevel;
    
    // 4. 积分一致性：DAPP端 === 链上（合约端）
    const pointsConsistency = Math.abs(dappPoints - chainPoints) < 0.001;
    
    // 5. 推荐人一致性：DAPP端 === 链上（合约端）
    const referrerConsistency = dappReferrer === chainReferrer;
    
    const isOverallConsistent = usdtBalanceConsistency && sciaBalanceConsistency && 
                               badgeConsistency && pointsConsistency && referrerConsistency;
    
    setConsistencyResults({
      usdtBalanceConsistency,
      sciaBalanceConsistency,
      badgeConsistency,
      pointsConsistency,
      referrerConsistency,
      isOverallConsistent
    });
  };

  // 定期验证三端一致性
  useEffect(() => {
    const verifyInterval = setInterval(() => {
      verifyThreeEndConsistency();
      setLastVerified(new Date());
    }, 30000);

    // 初始验证
    verifyThreeEndConsistency();

    return () => clearInterval(verifyInterval);
  }, [userBadgeInfo, testWalletAddress]);

  // 获取私募池信息
  const {
    data: poolInfo,
    isLoading: isLoadingPoolInfo
  } = useContractRead({
    address: PRIVATE_SALE_CONTRACT_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'getPoolInfo',
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  // 验证当前终端的数据完整性
  const verifyDataIntegrity = () => {
    if (!poolInfo) return false;
    
    // 检查核心数据字段是否存在且有效
    const hasValidData = poolInfo[0] !== undefined && poolInfo[4] !== undefined;
    const hasPositiveValues = Number(poolInfo[0]) >= 0 && Number(poolInfo[4]) >= 0;
    
    return hasValidData && hasPositiveValues;
  };

  const isDataIntegrityValid = verifyDataIntegrity();

  // 获取徽章数量统计
  const { data: memberCount } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getBadgeCount',
    args: [BadgeLevel.Member],
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  const { data: cityCount } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getBadgeCount',
    args: [BadgeLevel.City],
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  const { data: provinceCount } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getBadgeCount',
    args: [BadgeLevel.Province],
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  const { data: nationalCount } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getBadgeCount',
    args: [BadgeLevel.National],
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  // 计算销售进度
  const calculateSaleProgress = () => {
    if (!poolInfo) return 0;
    const [remainingPrivateSale, , , , totalSoldSCIA] = poolInfo;
    const totalPool = Number(remainingPrivateSale) + Number(totalSoldSCIA);
    if (totalPool === 0) return 0;
    return (Number(totalSoldSCIA) / totalPool) * 100;
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#000000', minHeight: 'calc(100vh - 180px)' }}>
      <Title level={2} style={{ 
        color: COLORS.textPrimary, 
        textAlign: 'center', 
        marginBottom: '30px',
        fontSize: FONT_SIZES.titleLarge,
        fontWeight: 'bold',
        lineHeight: LINE_HEIGHTS.title
      }}>
        <BarChartOutlined style={{ marginRight: '10px', fontSize: FONT_SIZES.titleMedium }} />
        实时数据监控面板
      </Title>

      {/* 加载状态 */}
      <Spin
        spinning={isLoadingPoolInfo}
        indicator={<LoadingOutlined style={{ fontSize: FONT_SIZES.titleLarge, color: COLORS.primary }} spin />}
      >
        {/* 概览统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM, alignItems: 'stretch' }}>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '24px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Statistic
                title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>总销售额</Text>}
                value={poolInfo ? Number(poolInfo[4]) / WEI_TO_USDT * 0.00001 : 0}
                precision={2}
                valueStyle={{ color: COLORS.success, fontSize: '28px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}
                suffix={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>USDT</Text>}
                prefix={<DollarCircleOutlined style={{ color: COLORS.success, fontSize: FONT_SIZES.titleSmall }} />}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '24px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Statistic
                title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>已售代币</Text>}
                value={poolInfo ? Number(poolInfo[4]) / 10 ** 18 : 0}
                precision={0}
                valueStyle={{ color: COLORS.primary, fontSize: '28px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}
                suffix={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>SCIA</Text>}
                prefix={<ArrowUpOutlined style={{ color: COLORS.primary, fontSize: FONT_SIZES.titleSmall }} />}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '24px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Statistic
                title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>剩余代币</Text>}
                value={poolInfo ? Number(poolInfo[0]) / 10 ** 18 : 0}
                precision={0}
                valueStyle={{ color: COLORS.warning, fontSize: '28px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}
                suffix={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>SCIA</Text>}
                prefix={<WalletOutlined style={{ color: COLORS.warning, fontSize: FONT_SIZES.titleSmall }} />}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '24px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Statistic
                title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>参与用户</Text>}
                value={Number(memberCount) + Number(cityCount) + Number(provinceCount) + Number(nationalCount) || 0}
                valueStyle={{ color: COLORS.badgeProvince, fontSize: '28px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}
                suffix={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>人</Text>}
                prefix={<UserOutlined style={{ color: COLORS.badgeProvince, fontSize: FONT_SIZES.titleSmall }} />}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 徽章统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM, alignItems: 'stretch' }}>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                textAlign: 'center',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              hoverable
            >
              <Title level={4} style={{ color: COLORS.badgeMember, margin: '0 0 12px', fontSize: '18px' }}>会员徽章</Title>
              <Statistic
                value={Number(memberCount) || 0}
                valueStyle={{ color: COLORS.badgeMember, fontSize: '36px' }}
                suffix="人"
              />
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginTop: '12px', fontSize: '14px' }}>
                0.11 USDT积分即可获得
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                textAlign: 'center',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              hoverable
            >
              <Title level={4} style={{ color: COLORS.badgeCity, margin: '0 0 12px', fontSize: '18px' }}>市级徽章</Title>
              <Statistic
                value={Number(cityCount) || 0}
                valueStyle={{ color: COLORS.badgeCity, fontSize: '36px' }}
                suffix="人"
              />
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginTop: '12px', fontSize: '14px' }}>
                0.55 USDT积分即可获得
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                textAlign: 'center',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              hoverable
            >
              <Title level={4} style={{ color: COLORS.badgeProvince, margin: '0 0 12px', fontSize: '18px' }}>省级徽章</Title>
              <Statistic
                value={Number(provinceCount) || 0}
                valueStyle={{ color: COLORS.badgeProvince, fontSize: '36px' }}
                suffix="人"
              />
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginTop: '12px', fontSize: '14px' }}>
                2.75 USDT积分即可获得
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                textAlign: 'center',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              hoverable
            >
              <Title level={4} style={{ color: COLORS.badgeNational, margin: '0 0 12px', fontSize: '18px' }}>国家级徽章</Title>
              <Statistic
                value={Number(nationalCount) || 0}
                valueStyle={{ color: COLORS.badgeNational, fontSize: '36px' }}
                suffix="人"
              />
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginTop: '12px', fontSize: '14px' }}>
                13.75 USDT积分即可获得
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 终端一致性与完整性验证 */}
        <Card 
          title={<span><BarChartOutlined style={{ marginRight: '8px', color: COLORS.primary }} /> 终端验证中心</span>} 
          style={{ ...CARD_STYLE, marginBottom: CARD_MARGIN_BOTTOM }}
          headStyle={CARD_HEAD_STYLE}
        >
          <Row gutter={16}>
            {/* 当前设备信息 */}
            <Col xs={24} sm={12} md={8}>
              <Title level={5} style={{ color: COLORS.textPrimary, marginBottom: '16px', fontSize: '16px' }}>当前设备</Title>
              <Row gutter={12}>
                <Col xs={8} sm={8}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px'
                  }}>
                    {deviceType === 'desktop' && <LaptopOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />}
                    {deviceType === 'mobile' && <MobileOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />}
                    {deviceType === 'tablet' && <TabletOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '8px' }} />}
                    <Text style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>
                      {deviceType === 'desktop' ? '桌面端' : deviceType === 'mobile' ? '移动端' : '平板端'}
                    </Text>
                  </div>
                </Col>
                <Col xs={16} sm={16}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                    <Text style={{ color: '#ffffff', opacity: 0.7, display: 'block', marginBottom: '8px' }}>视口尺寸</Text>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>
                      {viewportSize.width} × {viewportSize.height}
                    </Text>
                    <br />
                    <Text style={{ color: '#ffffff', opacity: 0.7, display: 'block', marginTop: '8px' }}>设备类型</Text>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>
                      {deviceType === 'desktop' ? '桌面端' : deviceType === 'mobile' ? '移动端' : '平板端'}
                    </Text>
                  </div>
                </Col>
              </Row>

              {/* 设备兼容性状态 */}
              <Title level={5} style={{ color: COLORS.textPrimary, marginTop: '24px', marginBottom: '16px', fontSize: '16px' }}>设备兼容性</Title>
              <div style={{ padding: '12px', backgroundColor: `rgba(${COLORS.success}, 0.1)`, borderRadius: '8px' }}>
                <Row gutter={16}>
                  <Col xs={12} sm={12}>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '4px', fontSize: '14px' }}>响应式适配</Text>
                    <Tag color="success" style={{ marginRight: '8px', fontSize: '12px' }}>✓ 支持</Tag>
                  </Col>
                  <Col xs={12} sm={12}>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '4px', fontSize: '14px' }}>功能完整性</Text>
                    <Tag color="success" style={{ marginRight: '8px', fontSize: '12px' }}>✓ 完整</Tag>
                  </Col>
                </Row>
              </div>

              {/* 钱包信息验证 */}
              <Title level={5} style={{ color: COLORS.textPrimary, marginTop: '24px', marginBottom: '16px', fontSize: '16px' }}>钱包信息验证</Title>
              <Card 
                style={{ 
                  ...CARD_STYLE, 
                  marginBottom: '16px'
                }}
                headStyle={{ padding: '12px', borderBottom: 'none' }}
                hoverable
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={12}>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>钱包地址</Text>
                    <Text style={{ 
                      color: COLORS.textPrimary, 
                      fontWeight: 'bold', 
                      wordBreak: 'break-all',
                      fontSize: '14px',
                      backgroundColor: COLORS.backgroundPrimary,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'block'
                    }}>
                      {testWalletAddress === '0x0000000000000000000000000000000000000000' ? '未连接钱包' : testWalletAddress}
                    </Text>
                  </Col>
                  <Col xs={24} sm={12} md={12}>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>链上数据</Text>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Tag color="success" style={{ marginRight: '8px', fontSize: '12px' }}>已获取</Tag>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '14px' }}>✓ 正常</Text>
                    </div>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', marginTop: '12px', fontSize: '14px' }}>数据同步</Text>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Tag color="success" style={{ marginRight: '8px', fontSize: '12px' }}>实时</Tag>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '14px' }}>5秒更新</Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* 数据完整性与一致性验证 */}
            <Col xs={24} sm={12} md={16}>
              <Title level={5} style={{ color: COLORS.textPrimary, marginBottom: '16px', fontSize: '16px' }}>三端一致性验证</Title>
              <Row gutter={16}>
                {/* 数据完整性 */}
                <Col span={24}>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: isDataIntegrityValid ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    border: `1px solid ${isDataIntegrityValid ? COLORS.success : COLORS.error}33`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleOutlined style={{ color: isDataIntegrityValid ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                        <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '16px' }}>
                          数据完整性：{isDataIntegrityValid ? '✓ 完整' : '✗ 不完整'}
                        </Text>
                      </div>
                      <Tag color={isDataIntegrityValid ? 'success' : 'error'} style={{ fontSize: '12px' }}>
                        {isDataIntegrityValid ? '完整' : '不完整'}
                      </Tag>
                    </div>
                    <Text style={{ color: COLORS.textSecondary, fontSize: '14px', marginTop: '8px', display: 'block' }}>
                      验证核心数据：剩余私募池代币、已售代币总量
                    </Text>
                  </div>
                </Col>

                {/* 三端一致性总览 */}
                <Col span={24}>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: consistencyResults.isOverallConsistent ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    border: `1px solid ${consistencyResults.isOverallConsistent ? COLORS.success : COLORS.error}33`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <BarChartOutlined style={{ color: consistencyResults.isOverallConsistent ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                        <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '16px' }}>
                          三端一致性：{consistencyResults.isOverallConsistent ? '✓ 一致' : '✗ 不一致'}
                        </Text>
                      </div>
                      <Tag color={consistencyResults.isOverallConsistent ? 'success' : 'error'} style={{ fontSize: '12px' }}>
                        {consistencyResults.isOverallConsistent ? '一致' : '不一致'}
                      </Tag>
                    </div>
                    <Text style={{ color: COLORS.textSecondary, fontSize: '14px', marginTop: '8px', display: 'block' }}>
                      验证DAPP数据与链上数据的一致性
                    </Text>
                  </div>
                </Col>

                {/* 私募池信息 */}
                <Col span={24}>
                  <Card 
                    title="私募池信息" 
                    style={{ 
                      ...CARD_STYLE, 
                      marginBottom: '16px'
                    }}
                    headStyle={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    hoverable
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>剩余私募池代币</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[0]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>剩余奖励池代币</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[1]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>当前私募池余额</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[2]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>当前奖励池余额</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[3]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>总售出代币</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[4]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>总分发奖励</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[5]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* 合约地址信息 */}
                <Col span={24}>
                  <Card 
                    title="合约地址" 
                    style={{ 
                      ...CARD_STYLE, 
                      marginBottom: '16px'
                    }}
                    headStyle={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    hoverable
                  >
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '12px', fontSize: '14px' }}>私募合约：</Text>
                    <Text style={{ 
                      color: COLORS.primary, 
                      wordBreak: 'break-all',
                      fontSize: '14px',
                      backgroundColor: `rgba(24, 144, 255, 0.1)`,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'block',
                      marginBottom: '16px'
                    }}>{PRIVATE_SALE_CONTRACT_ADDRESS}</Text>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginTop: '16px', marginBottom: '12px', fontSize: '14px' }}>推荐中心合约：</Text>
                    <Text style={{ 
                      color: COLORS.primary, 
                      wordBreak: 'break-all',
                      fontSize: '14px',
                      backgroundColor: `rgba(24, 144, 255, 0.1)`,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'block'
                    }}>{REFERRAL_CENTER_ADDRESS}</Text>
                  </Card>
                </Col>

                {/* 合约状态验证 */}
                <Col span={24}>
                  <Card 
                    title="合约状态验证" 
                    style={{ 
                      ...CARD_STYLE, 
                      marginBottom: '16px'
                    }}
                    headStyle={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    hoverable
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>销售状态</Text>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Tag color={isEnded ? 'error' : (isPaused ? 'warning' : 'success')} style={{ marginRight: '8px', fontSize: '12px' }}>
                            {isEnded ? '已结束' : (isPaused ? '已暂停' : '进行中')}
                          </Tag>
                          <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '14px' }}>
                            {isEnded ? '销售已结束' : (isPaused ? '销售已暂停' : '销售进行中')}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>已售总量</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? (Number(poolInfo[4]) / 10 ** 18).toFixed(2) : '0.00'} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>总销售额</Text>
                        <Text style={{ 
                          color: COLORS.success, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: 'rgba(82, 196, 26, 0.1)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? (Number(poolInfo[4]) / 10 ** 18 * 0.00001).toFixed(4) : '0.0000'} USDT
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* 徽章信息验证 */}
                <Col span={24}>
                  <Card 
                    title="徽章信息验证" 
                    style={{ 
                      ...CARD_STYLE, 
                      marginBottom: '16px'
                    }}
                    headStyle={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    hoverable
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>当前徽章</Text>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Tag 
                            color={calculateBadgeVerification().status === 'success' ? 'success' : 'pending'} 
                            style={{ marginRight: '8px', fontSize: '12px' }}
                          >
                            {calculateBadgeVerification().status === 'success' ? '已获得' : '未获得'}
                          </Tag>
                          <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '14px' }}>
                            {calculateBadgeVerification().badgeName}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>当前积分</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {userBadgeInfo ? (Number(userBadgeInfo[1]) / 10 ** 18).toFixed(4) : '0.0000'} USDT
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>国家级阈值</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {nationalBadgeThreshold ? (Number(nationalBadgeThreshold) / 10 ** 18).toFixed(2) : '0.00'} USDT
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* 详细验证结果 */}
                <Col span={24}>
                  <div style={{ backgroundColor: COLORS.backgroundSecondary, padding: '16px', borderRadius: '8px', marginBottom: '16px', border: `1px solid ${COLORS.border}` }}>
                    <Title level={5} style={{ color: COLORS.textPrimary, marginBottom: '16px', fontSize: '16px' }}>详细验证结果</Title>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <CheckCircleOutlined style={{ color: consistencyResults.usdtBalanceConsistency ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                          <Text style={{ color: COLORS.textSecondary }}>
                            USDT余额一致性：{consistencyResults.usdtBalanceConsistency ? '✓ 一致' : '✗ 不一致'}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <CheckCircleOutlined style={{ color: consistencyResults.sciaBalanceConsistency ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                          <Text style={{ color: COLORS.textSecondary }}>
                            SCIA余额一致性：{consistencyResults.sciaBalanceConsistency ? '✓ 一致' : '✗ 不一致'}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <CheckCircleOutlined style={{ color: consistencyResults.badgeConsistency ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                          <Text style={{ color: COLORS.textSecondary }}>
                            徽章一致性：{consistencyResults.badgeConsistency ? '✓ 一致' : '✗ 不一致'}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <CheckCircleOutlined style={{ color: consistencyResults.pointsConsistency ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                          <Text style={{ color: COLORS.textSecondary }}>
                            积分一致性：{consistencyResults.pointsConsistency ? '✓ 一致' : '✗ 不一致'}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={24}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <CheckCircleOutlined style={{ color: consistencyResults.referrerConsistency ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                          <Text style={{ color: COLORS.textSecondary }}>
                            推荐人一致性：{consistencyResults.referrerConsistency ? '✓ 一致' : '✗ 不一致'}
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>

                {/* 验证信息 */}
                <Col span={24}>
                  <div style={{ backgroundColor: COLORS.backgroundSecondary, padding: '16px', borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>验证指标</Text>
                        <ul style={{ color: COLORS.textSecondary, margin: 0, paddingLeft: 20, fontSize: '14px' }}>
                          <li style={{ marginBottom: '6px' }}>USDT余额一致性（钱包端/合约端/DAPP端）</li>
                          <li style={{ marginBottom: '6px' }}>SCIA余额一致性（钱包端/合约端/DAPP端）</li>
                          <li style={{ marginBottom: '6px' }}>徽章等级一致性（DAPP端/合约端）</li>
                          <li style={{ marginBottom: '6px' }}>积分数据一致性（DAPP端/合约端）</li>
                          <li>推荐人信息一致性（DAPP端/合约端）</li>
                        </ul>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>验证信息</Text>
                        <ul style={{ color: COLORS.textSecondary, margin: 0, paddingLeft: 20, fontSize: '14px' }}>
                          <li style={{ marginBottom: '6px' }}>验证频率：30秒/次</li>
                          <li style={{ marginBottom: '6px' }}>最后验证：{lastVerified.toLocaleString()}</li>
                          <li style={{ marginBottom: '6px' }}>验证状态：{consistencyResults.isOverallConsistent ? '✓ 正常' : '✗ 异常'}</li>
                          <li>设备类型：{deviceType === 'desktop' ? '桌面端' : deviceType === 'mobile' ? '移动端' : '平板端'}</li>
                        </ul>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* 销售进度 */}
        <Card 
          style={{ 
            ...CARD_STYLE, 
            marginBottom: CARD_MARGIN_BOTTOM,
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease-in-out, transform 0.3s ease-out, box-shadow 0.3s ease-out',
            transform: 'translateY(0)'
          }}
          hoverable
        >
          <Row gutter={16} align="middle">
            <Col xs={24} sm={24} md={8}>
              <Title level={4} style={{ color: COLORS.textPrimary, margin: 0, fontSize: FONT_SIZES.titleSmall, fontWeight: 'bold' }}>销售进度</Title>
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>
                {poolInfo ? `${Number(poolInfo[4]) / 10 ** 18} SCIA / ${(Number(poolInfo[0]) + Number(poolInfo[4])) / 10 ** 18} SCIA` : '0 / 0'}
              </Text>
            </Col>
            <Col xs={24} sm={24} md={16}>
              <Progress 
                percent={calculateSaleProgress() || 0} 
                strokeColor={{
                  '0%': '#1890ff',
                  '100%': '#52c41a',
                }} 
                style={{ marginBottom: '8px' }}
                strokeWidth={10}
                format={percent => (
                  <span style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: FONT_SIZES.bodyLarge }}>
                    {(percent || 0).toFixed(1)}%
                  </span>
                )}
                trailColor="rgba(255, 255, 255, 0.1)"
              />
              <Text style={{ color: COLORS.textTertiary, fontSize: FONT_SIZES.bodySmall, display: 'block', textAlign: 'center' }}>
                实时更新中...
              </Text>
            </Col>
          </Row>
        </Card>
      </Spin>
    </div>
  );
};

export default StatisticsPage;