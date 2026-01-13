import React from 'react';
import { useContractRead } from 'wagmi';
import { useAccount } from 'wagmi';
import { referralCenterAbi } from '../abi/referralCenter';
import { usdtAbi } from '../abi/usdt';
import { sciaAbi } from '../abi/scia';
import { privateSaleAbi } from '../abi/privateSale';
import { Badge, Button, Modal, Tree, Tabs, message } from 'antd';
import { LoadingOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';

// 获取合约地址
const REFERRAL_CENTER_ADDRESS = import.meta.env.REACT_APP_TESTNET_REFERRAL_CENTER_ADDRESS as `0x${string}`;
const USDT_ADDRESS = import.meta.env.REACT_APP_TESTNET_USDT_ADDRESS as `0x${string}`;
const PRIVATE_SALE_CONTRACT_ADDRESS = import.meta.env.REACT_APP_TESTNET_PRIVATE_SALE_CONTRACT_ADDRESS as `0x${string}`;
const SCIA_ADDRESS = import.meta.env.REACT_APP_TESTNET_SANCIA_TOKEN_ADDRESS as `0x${string}`;

const ProfilePage = () => {
  const { address: userAddress, isConnected } = useAccount();
  
  // 推荐树模态框状态
  const [treeModalVisible, setTreeModalVisible] = React.useState(false);
  const [treeData, setTreeData] = React.useState<any[]>([]);
  const [isLoadingTree, setIsLoadingTree] = React.useState(false);
  // 推荐统计数据
  const [referralStats, setReferralStats] = React.useState({
    directCount: 0,
    totalCount: 0,
    totalUSDTReward: '0',
    totalSCIAReward: '0'
  });
  // 推荐人奖励贡献数据
  const [referralContributions, setReferralContributions] = React.useState<Array<{
    address: string;
    totalSCIA: string;
    totalUSDT: string;
  }>>([]);
  
  // 获取直接推荐列表
  const [directReferrals, setDirectReferrals] = React.useState<Array<{ address: string }>>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = React.useState(false);
  
  // 检查用户是否有购买记录
  const { data: purchaseAmount, isLoading: isCheckingPurchase } = useContractRead({
    address: PRIVATE_SALE_CONTRACT_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'purchaseAmounts',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected,
      refetchInterval: 30000,
    },
  });
  
  // 计算是否有购买记录
  const hasPurchaseRecord = React.useMemo(() => {
    if (!purchaseAmount) return false;
    return purchaseAmount > 0n;
  }, [purchaseAmount]);
  
  // 获取用户徽章信息
  const { data: userBadgeInfo, isLoading: isUserBadgeInfoLoading } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getUserBadgeInfo',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected, 
      refetchInterval: 30000, // 每30秒刷新一次
    },
  });

  // 获取推荐人地址
  const { data: referrerAddress } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'referrers',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected,
      refetchInterval: 30000,
    },
  });

  // 加载直接推荐列表
  const loadDirectReferrals = async () => {
    if (!isConnected || !userAddress) return;
    
    setIsLoadingReferrals(true);
    try {
      const referrals: Array<{ address: string }> = [];
      let index = 0;
      
      // 最多获取5个直接推荐
      while (referrals.length < 5) {
        try {
          const referralAddress = await window.ethereum?.request({
            method: 'eth_call',
            params: [
              {
                to: REFERRAL_CENTER_ADDRESS,
                data: `0x${(await import('viem')).encodeFunctionData({
                  abi: referralCenterAbi,
                  functionName: 'referrals',
                  args: [userAddress, BigInt(index)]
                }).slice(2)}`,
              },
              'latest',
            ],
          });

          // 正确解析返回值 - eth_call返回的是带前缀的十六进制字符串，需要去除前缀并确保是有效的地址格式
          if (referralAddress && referralAddress !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
            // 去除前缀并确保地址是40个字符
            let parsedAddress = referralAddress;
            if (parsedAddress.startsWith('0x')) {
              parsedAddress = parsedAddress.slice(2);
            }
            // 确保地址长度正确（32字节 -> 64字符，转换为以太坊地址需要取后20字节）
            if (parsedAddress.length === 64) {
              parsedAddress = '0x' + parsedAddress.slice(24); // 取后20字节作为地址
            } else if (parsedAddress.length === 40) {
              parsedAddress = '0x' + parsedAddress;
            }
            
            referrals.push({ address: parsedAddress });
          } else {
            break;
          }
        } catch {
          break;
        }
        index++;
      }
      
      setDirectReferrals(referrals);
    } catch {
      // 忽略错误
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  // 组件挂载时加载直接推荐列表
  React.useEffect(() => {
    loadDirectReferrals();
  }, [isConnected, userAddress]);

  // 递归构建推荐树并统计推荐人数
  const buildReferralTree = async (address: string, depth: number = 0): Promise<{ node: any; count: number }> => {
    // 使用钱包地址作为节点标题
    const node: any = {
      title: `${address.slice(0, 8)}...${address.slice(-6)}`,
      key: address,
      children: [],
    };
    
    let totalCount = 1; // 包括当前节点
    let index = 0;
    
    while (true) {
      try {
        const referralAddress = await window.ethereum?.request({
          method: 'eth_call',
          params: [
            {
              to: REFERRAL_CENTER_ADDRESS,
              data: `0x${(await import('viem')).encodeFunctionData({
                abi: referralCenterAbi,
                functionName: 'referrals',
                args: [address as `0x${string}`, BigInt(index)]
              }).slice(2)}`,
            },
            'latest',
          ],
        });
        
        // 正确解析返回值 - eth_call返回的是带前缀的十六进制字符串，需要去除前缀并确保是有效的地址格式
        if (referralAddress && referralAddress !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          // 去除前缀并确保地址是40个字符
          let parsedAddress = referralAddress;
          if (parsedAddress.startsWith('0x')) {
            parsedAddress = parsedAddress.slice(2);
          }
          // 确保地址长度正确（32字节 -> 64字符，转换为以太坊地址需要取后20字节）
          if (parsedAddress.length === 64) {
            parsedAddress = '0x' + parsedAddress.slice(24); // 取后20字节作为地址
          } else if (parsedAddress.length === 40) {
            parsedAddress = '0x' + parsedAddress;
          }
          
          const { node: childNode, count: childCount } = await buildReferralTree(parsedAddress, depth + 1);
          if (childNode) {
            node.children.push(childNode);
            totalCount += childCount;
          }
        } else {
          break;
        }
      } catch {
        break;
      }
      index++;
    }
    
    return { node, count: totalCount };
  };

  // 计算每个推荐人的贡献和推荐奖励
  const calculateReferralContributions = async (treeData: any[]) => {
    if (!isConnected || !userAddress) return;
    
    try {
      // 从推荐树中获取所有被推荐人地址
      const getAllReferrals = (data: any[]): string[] => {
        let referrals: string[] = [];
        
        const traverse = (nodes: any[]) => {
          for (const node of nodes) {
            if (node.key !== userAddress) {
              referrals.push(node.key);
            }
            if (node.children && node.children.length > 0) {
              traverse(node.children);
            }
          }
        };
        
        traverse(data);
        return referrals;
      };
      
      const allReferrals = getAllReferrals(treeData);
      
      // 推荐奖励比例（根据实际合约逻辑调整）
      const USDT_REWARD_PERCENTAGE = 0.05; // 5% USDT奖励
      const SCIA_REWARD_PERCENTAGE = 0.05; // 5% SCIA奖励
      
      // 核心规则：0.01 USDT = 1000 SCIA
      const PACKAGE_COST_USDT = 0.01; // 每包成本（USDT）
      const SCIA_PER_PACKAGE = 1000; // 每包包含的SCIA数量
      
      // 为每个被推荐人获取真实购买数据并计算推荐奖励
      const contributionsArray = await Promise.all(allReferrals.map(async (address) => {
        try {
          // 检查window.ethereum是否存在
          if (!window.ethereum) {
            return {
              address,
              totalSCIA: '0',
              totalUSDT: '0'
            };
          }
          
          const viem = await import('viem');
          
          // 查询被推荐人的购买金额（返回USDT的wei值）
          const purchaseAmountResult = await window.ethereum.request({
            method: 'eth_call',
            params: [
              {
                to: PRIVATE_SALE_CONTRACT_ADDRESS,
                data: `0x${viem.encodeFunctionData({
                  abi: privateSaleAbi,
                  functionName: 'purchaseAmounts',
                  args: [address as `0x${string}`]
                }).slice(2)}`,
              },
              'latest',
            ],
          });
          
          // 解析购买金额
          let purchaseAmountWei = BigInt(0);
          if (purchaseAmountResult && purchaseAmountResult !== '0x') {
            purchaseAmountWei = BigInt(purchaseAmountResult);
          }
          
          // 正确计算：0.01 USDT = 1000 SCIA
          // 1. 先将USDT的wei值转换为USDT金额
          const usdtAmount = Number(purchaseAmountWei) / (10 ** 18);
          // 2. 根据比例计算SCIA数量：每0.01 USDT对应1000 SCIA
          const sciaAmount = usdtAmount * (SCIA_PER_PACKAGE / PACKAGE_COST_USDT);
          
          // 返回计算结果，totalSCIA直接存储计算出的SCIA数量
          return {
            address,
            totalSCIA: sciaAmount.toString(),
            totalUSDT: purchaseAmountWei.toString()
          };
        } catch (error) {
          return {
            address,
            totalSCIA: '0',
            totalUSDT: '0'
          };
        }
      }));
      
      // 计算总推荐奖励
      let totalUSDTReward = BigInt(0);
      let totalSCIAReward = BigInt(0);
      
      for (const contribution of contributionsArray) {
        const usdtAmount = BigInt(contribution.totalUSDT); // USDT的wei值
        const sciaAmount = Number(contribution.totalSCIA); // SCIA的数量
        
        // 计算奖励并累加到总奖励中
        // USDT奖励：5%的USDT购买金额（wei值）
        totalUSDTReward += BigInt(Math.floor(Number(usdtAmount) * USDT_REWARD_PERCENTAGE));
        
        // SCIA奖励：5%的SCIA获得数量
        // 注意：sciaAmount已经是SCIA的数量，转换为wei值后再计算奖励
        const sciaAmountWei = BigInt(Math.floor(sciaAmount)) * BigInt(10 ** 18);
        totalSCIAReward += BigInt(Math.floor(Number(sciaAmountWei) * SCIA_REWARD_PERCENTAGE));
      }
      
      // 更新推荐统计数据，包括总奖励
      setReferralStats(prev => ({
        ...prev,
        totalUSDTReward: totalUSDTReward.toString(),
        totalSCIAReward: totalSCIAReward.toString()
      }));
      
      setReferralContributions(contributionsArray);
    } catch (error) {
      // 即使出错，也要设置一个空数组，确保表格显示
      setReferralContributions([]);
    }
  };

  // 打开推荐树模态框
  const handleViewReferralTree = async () => {
    if (!isConnected || !userAddress) return;
    
    setIsLoadingTree(true);
    setTreeModalVisible(true);
    
    try {
      const { node: tree, count: totalCount } = await buildReferralTree(userAddress);
      
      if (tree) {
        setTreeData([tree]);
        // 计算直接推荐人数（当前节点的子节点数量）
        const directCount = tree.children.length;
        // 更新推荐统计数据，保留原有奖励数据
        setReferralStats(prev => ({
          ...prev,
          directCount,
          totalCount: totalCount - 1 // 减去当前节点本身
        }));
      } else {
        setTreeData([]);
        setReferralStats({
          directCount: 0,
          totalCount: 0,
          totalUSDTReward: '0',
          totalSCIAReward: '0'
        });
      }
      
      // 计算每个推荐人的贡献
      await calculateReferralContributions([tree]);
    } catch {
      setTreeData([]);
      setReferralStats({
        directCount: 0,
        totalCount: 0,
        totalUSDTReward: '0',
        totalSCIAReward: '0'
      });
      setReferralContributions([]);
    } finally {
      setIsLoadingTree(false);
    }
  };

  // 获取可领取分红
  const { data: claimableDividends } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getUserClaimableDividends',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected,
      refetchInterval: 30000,
    },
  });

  // 分红领取功能（暂时禁用，等待Wagmi 2.0 API确认）
  const isClaimingDividend = false;
  const handleClaimDividend = () => {
    // 暂时禁用，等待Wagmi 2.0 API确认
  };

  // 格式化分红金额
  const formatDividend = (amount: bigint | undefined): string => {
    if (!amount) return '0';
    return (Number(amount) / 10 ** 18).toFixed(6);
  };

  // 获取USDT余额
  const { data: usdtBalance, isLoading: isUSDTBalanceLoading } = useContractRead({
    address: USDT_ADDRESS,
    abi: usdtAbi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}` || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected && !!userAddress,
      refetchInterval: 30000, // 每30秒刷新一次
    },
  });

  // 获取USDT授权额度
  const { data: usdtAllowance, isLoading: isUSDTAllowanceLoading } = useContractRead({
    address: USDT_ADDRESS,
    abi: usdtAbi,
    functionName: 'allowance',
    args: [
      userAddress as `0x${string}` || '0x0000000000000000000000000000000000000000',
      PRIVATE_SALE_CONTRACT_ADDRESS
    ],
    query: {
      enabled: isConnected && !!userAddress,
      refetchInterval: 30000, // 每30秒刷新一次
    },
  });

  // 获取SCIA余额
  const { data: sciaBalance, isLoading: isSCIABalanceLoading } = useContractRead({
    address: SCIA_ADDRESS,
    abi: sciaAbi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}` || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected && !!userAddress,
      refetchInterval: 30000, // 每30秒刷新一次
    },
  });

  // 格式化积分值（积分单位是wei，直接转换为USDT金额，合约已处理测试网参数缩放）
  const formatPoints = (points: bigint | undefined): string => {
    if (!points) return '0';
    
    // 转换为USDT金额（1 USDT = 10^18 wei）
    const usdtAmount = Number(points) / 10 ** 18;
    
    return usdtAmount.toFixed(2);
  };

  // 格式化USDT金额（从wei转换为USDT）
  const formatUSDT = (amount: bigint | undefined): string => {
    if (!amount) return '0';
    return (Number(amount) / 10 ** 18).toFixed(6);
  };

  // 格式化SCIA数量（处理不同类型的输入）
  const formatSCIA = (amount: any): string => {
    if (!amount) return '0';
    // 处理不同类型的输入
    let numAmount: number;
    
    if (typeof amount === 'bigint') {
      // 从合约读取的SCIA余额是wei单位，需要转换为正常单位
      numAmount = Number(amount) / (10 ** 18);
    } else {
      // 直接使用Number()转换，处理字符串或数字类型
      numAmount = Number(amount);
    }
    
    return numAmount.toFixed(6);
  };

  // 获取徽章等级名称
  const getBadgeLevelName = (level: number): string => {
    switch (level) {
      case 0: return '无';
      case 1: return '会员';
      case 2: return '市级';
      case 3: return '省级';
      case 4: return '国家级';
      default: return '无';
    }
  };

  return (
    <div className="page-container profile-page">
      <section className="profile-section">
        <h2>个人中心</h2>
        <div className="profile-info">
          {/* 个人信息 */}
          <div className="avatar-container" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div className="avatar" style={{ 
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {/* 默认头像，移除自定义头像功能 */}
              <span style={{ fontSize: '50px' }}>👤</span>
            </div>
          </div>
          <div className="user-info">
            <p>钱包地址：{isConnected ? userAddress?.slice(0, 10) + '...' + userAddress?.slice(-8) : '未连接'}</p>
            <p>
              推荐人：
              {referrerAddress && referrerAddress !== '0x0000000000000000000000000000000000000000' ? (
                <span>
                  {referrerAddress.slice(0, 10) + '...' + referrerAddress.slice(-8)}
                </span>
              ) : (
                <span>无</span>
              )}
            </p>
          </div>
          <div className="badge-info">
            <h3>徽章等级</h3>
            <div className="badge">
              <span className="badge-icon">🏆</span>
              <div className="badge-details">
                {isUserBadgeInfoLoading ? (
                  <p>加载中...</p>
                ) : userBadgeInfo ? (
                  <>
                    <p>当前徽章：{getBadgeLevelName(userBadgeInfo[0])}</p>
                    <p>升级到下一等级还需要：{formatPoints(userBadgeInfo[2] - userBadgeInfo[1])}积分</p>
                  </>
                ) : (
                  <p>当前徽章：无</p>
                )}
              </div>
            </div>
          </div>
          <div className="points-info">
            <h3>积分与奖励</h3>
            {(isUserBadgeInfoLoading || isUSDTBalanceLoading || isUSDTAllowanceLoading || isSCIABalanceLoading) ? (
              <p>加载中...</p>
            ) : (
              <>
                <p>总积分：{userBadgeInfo ? formatPoints(userBadgeInfo[1]) : '0'}</p>
                <p>USDT余额：{formatUSDT(usdtBalance)}</p>
                <p>USDT授权额度：{formatUSDT(usdtAllowance)}</p>
                <p>SCIA余额：{formatSCIA(sciaBalance)}</p>
              </>
            )}
          </div>
          
          {/* 推荐统计功能已整合到查询所有推荐树中 */}

          {/* 分红领取功能 */}
          <div className="dividend-info">
            <h3>分红领取</h3>
            {(isUserBadgeInfoLoading) ? (
              <p>加载中...</p>
            ) : (
              <>
                <p>可领取分红：{formatDividend(claimableDividends)} USDT</p>
            <div className="dividend-buttons">
              {userBadgeInfo && userBadgeInfo[0] >= 1 && (
                <Button 
                  type="primary" 
                  onClick={handleClaimDividend}
                  loading={isClaimingDividend}
                  style={{ marginRight: 8 }}
                  disabled
                >
                  领取{getBadgeLevelName(userBadgeInfo[0])}分红
                </Button>
              )}
            </div>
              </>
            )}
          </div>
        </div>
        <div className="referral-info" style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
          <Tabs defaultActiveKey="promotion">
            <Tabs.TabPane tab="推广信息" key="promotion">
              {isCheckingPurchase ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <LoadingOutlined spin style={{ fontSize: 24 }} />
                  <p style={{ marginTop: 10 }}>正在检查购买记录...</p>
                </div>
              ) : hasPurchaseRecord ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0' }}>
                  <div className="referral-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0 }}>推广链接：</p>
                    <input
                      type="text"
                      value={`https://scia-dapp.com?ref=${userAddress || '0x0000000000000000000000000000000000000000'}`}
                      readOnly
                      style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #d9d9d9',
                        backgroundColor: '#fff',
                        color: '#000',
                      }}
                    />
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const referralLink = `https://scia-dapp.com?ref=${userAddress || '0x0000000000000000000000000000000000000000'}`;
                        navigator.clipboard.writeText(referralLink)
                          .then(() => {
                            message.success('复制成功！');
                          })
                          .catch(() => {
                            message.error('复制失败，请手动复制');
                          });
                      }}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      复制链接
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <p style={{ margin: 0 }}>推广二维码：</p>
                    <div className="qr-code" style={{ 
                      padding: '10px', 
                      backgroundColor: '#fff', 
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      alignSelf: 'flex-start'
                    }}>
                      <QRCodeSVG 
                        value={`https://scia-dapp.com?ref=${userAddress}`} 
                        size={140} 
                        level="H" 
                        includeMargin={false} 
                        bgColor="#ffffff" 
                        fgColor="#000000" 
                      />
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => {
                          // 生成真实的二维码并下载
                          const qrValue = `https://scia-dapp.com?ref=${userAddress}`;
                            
                          // 创建一个临时容器来渲染二维码
                          const tempContainer = document.createElement('div');
                          document.body.appendChild(tempContainer);
                            
                          // 使用ReactDOMServer将QRCodeSVG组件渲染为HTML字符串
                          const { renderToString } = require('react-dom/server');
                          const qrCodeHtml = renderToString(
                            React.createElement(QRCodeSVG, {
                              value: qrValue,
                              size: 400, // 生成更大的二维码，提高清晰度
                              level: 'H',
                              includeMargin: false,
                              bgColor: '#ffffff',
                              fgColor: '#000000'
                            })
                          );
                            
                          // 将HTML字符串转换为完整的SVG
                          const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
${qrCodeHtml}`;
                            
                          // 创建Blob对象
                          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                            
                          // 创建下载链接
                          const downloadLink = document.createElement('a');
                          downloadLink.href = URL.createObjectURL(blob);
                          downloadLink.download = `SCIA推广二维码_${userAddress?.slice(0, 8)}.svg`;
                          downloadLink.click();
                            
                          // 清理临时容器
                          document.body.removeChild(tempContainer);
                        }}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        下载二维码
                      </Button>
                    </div>
                  </div>
                  <div className="direct-referrals" style={{ marginTop: '8px' }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>直接推荐（最近5人）</h4>
                    {isLoadingReferrals ? (
                      <p>加载中...</p>
                    ) : directReferrals.length > 0 ? (
                      <ul style={{ margin: '0', paddingLeft: '20px' }}>
                        {directReferrals.map((referral, index) => (
                          <li key={index}>
                            <Badge status="success" /> {referral.address.slice(0, 10) + '...' + referral.address.slice(-8)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>暂无推荐记录</p>
                    )}
                  </div>
                  <Button 
                    type="primary" 
                    className="view-all-referrals-btn"
                    onClick={handleViewReferralTree}
                    loading={isLoadingTree}
                  >
                    查询所有推荐树（包含推荐统计）
                  </Button>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  backgroundColor: 'rgba(255, 173, 173, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid #ff4d4f'
                }}>
                  <h3 style={{ color: '#ff4d4f', marginBottom: '16px' }}>暂无推广权限</h3>
                  <p>根据合约规则，您需要先购买SCIA代币才能获取专属推广链接和二维码</p>
                  <Button 
                    type="primary" 
                    style={{ marginTop: '16px' }}
                    onClick={() => window.location.href = '/buy'}
                  >
                    立即购买
                  </Button>
                </div>
              )}
            </Tabs.TabPane>
          </Tabs>
        </div>

          {/* 推荐树模态框 */}
          <Modal
            title="推荐树"
            open={treeModalVisible}
            onCancel={() => setTreeModalVisible(false)}
            footer={null}
            width={800}
          >
            {isLoadingTree ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <LoadingOutlined spin style={{ fontSize: 48 }} />
                <p style={{ marginTop: 20 }}>正在加载推荐树...</p>
              </div>
            ) : (
              <>
                {/* 推荐统计信息 */}
                <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                  <h4>推荐统计</h4>
                  <div style={{ display: 'flex', gap: '32px' }}>
                    <div>
                      <p>直接推荐人数：{referralStats.directCount}</p>
                    </div>
                    <div>
                      <p>总推荐人数：{referralStats.totalCount}</p>
                    </div>
                    <div>
                      <p>总USDT奖励：{formatUSDT(BigInt(referralStats.totalUSDTReward))}</p>
                    </div>
                    <div>
                      <p>总SCIA奖励：{formatSCIA(Number(referralStats.totalSCIAReward) / (10 ** 18))}</p>
                    </div>
                  </div>
                </div>
                
                {/* 推荐人贡献列表 */}
                <div style={{ marginBottom: '20px' }}>
                  <h4>被推荐人购买明细</h4>
                  {referralContributions.length > 0 ? (
                    <>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f5f5f5' }}>
                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>被推荐人</th>
                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>购买SCIA数量</th>
                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>购买USDT金额</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralContributions.map((contribution, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                {contribution.address.slice(0, 10)}...{contribution.address.slice(-8)}
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                {formatSCIA(contribution.totalSCIA)}
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                {formatUSDT(BigInt(contribution.totalUSDT))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        注：以上为被推荐人的真实购买数据，推荐奖励根据合约规则（USDT 5% + SCIA 5%）自动计算
                      </p>
                    </>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      暂无被推荐人购买记录
                    </p>
                  )}
                </div>
                
                {/* 推荐树展示 */}
                {treeData.length > 0 ? (
                  <Tree
                    treeData={treeData}
                    defaultExpandAll
                    showIcon
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>暂无推荐关系</p>
                  </div>
                )}
              </>
            )}
          </Modal>
      </section>
    </div>
  );
};

export default ProfilePage;