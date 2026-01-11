import React, { useState } from 'react';
import { useContractRead, useWatchContractEvent } from 'wagmi';
import { useAccount } from 'wagmi';
import { referralCenterAbi } from '../abi/referralCenter';
import { usdtAbi } from '../abi/usdt';
import { sciaAbi } from '../abi/scia';
import { privateSaleAbi } from '../abi/privateSale';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { Badge, Button, Modal, Tree, Table, Tag, Tabs, message } from 'antd';
import { LoadingOutlined, ReloadOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';

// 获取合约地址
const REFERRAL_CENTER_ADDRESS = import.meta.env.REACT_APP_TESTNET_REFERRAL_CENTER_ADDRESS as `0x${string}`;
const USDT_ADDRESS = import.meta.env.REACT_APP_TESTNET_USDT_ADDRESS as `0x${string}`;
const PRIVATE_SALE_CONTRACT_ADDRESS = import.meta.env.REACT_APP_TESTNET_PRIVATE_SALE_CONTRACT_ADDRESS as `0x${string}`;
const SCIA_ADDRESS = import.meta.env.REACT_APP_TESTNET_SANCIA_TOKEN_ADDRESS as `0x${string}`;

const ProfilePage: React.FC = () => {
  const { address: userAddress, isConnected } = useAccount();
  
  // 从Redux store获取用户信息
  const { username, avatar, createdAt } = useSelector(
    (state: RootState) => state.user
  );
  
  // 总奖励状态
  const [totalSCIA, setTotalSCIA] = React.useState<bigint>(0n);
  const [totalUSDT, setTotalUSDT] = React.useState<bigint>(0n);
  
  // 奖励明细状态
  const [rewardDetails, setRewardDetails] = React.useState<any[]>([]);
  const [isLoadingRewardDetails, setIsLoadingRewardDetails] = React.useState(false);
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 10, total: 0 });
  
  // 头像上传状态
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  
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
  
  // 从后端获取用户总奖励
  const fetchUserRewards = async () => {
    if (!isConnected || !userAddress) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userAddress}`);
      if (response.ok) {
        const userData = await response.json();
        if (userData.data && userData.data.totalRewards) {
          setTotalSCIA(BigInt(userData.data.totalRewards.scia));
          setTotalUSDT(BigInt(userData.data.totalRewards.usdt));
        }
      }
    } catch (error) {
      console.error('获取用户总奖励失败:', error);
    }
  };
  
  React.useEffect(() => {
    fetchUserRewards();
    
    // 每30秒刷新一次总奖励数据
    const interval = setInterval(fetchUserRewards, 30000);
    
    return () => clearInterval(interval);
  }, [isConnected, userAddress]);
  
  // 从后端获取奖励明细
  const fetchRewardDetails = async (page: number = 1, limit: number = 10) => {
    if (!isConnected || !userAddress) return;
    
    setIsLoadingRewardDetails(true);
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userAddress}/reward-details?page=${page}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setRewardDetails(data.data.rewardDetails);
          setPagination({
            current: page,
            pageSize: limit,
            total: data.data.pagination.total
          });
        }
      }
    } catch (error) {
      console.error('获取奖励明细失败:', error);
    } finally {
      setIsLoadingRewardDetails(false);
    }
  };
  
  React.useEffect(() => {
    fetchRewardDetails();
  }, [isConnected, userAddress]);
  
  // 处理分页变化
  const handlePageChange = (page: number, pageSize: number) => {
    fetchRewardDetails(page, pageSize);
  };
  
  // 监听推荐奖励事件
  useWatchContractEvent({
    address: PRIVATE_SALE_CONTRACT_ADDRESS,
    abi: privateSaleAbi,
    eventName: 'ReferralRewardDistributed',
    onLogs(logs) {
      for (const log of logs) {
        if (log.args.referrer === userAddress) {
          // 调用后端API更新奖励
          fetch(`http://localhost:3001/api/users/${log.args.referrer}/rewards`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sciaReward: log.args.sciaReward,
              usdtReward: log.args.usdtReward,
              transactionHash: log.transactionHash,
              relatedAddress: '',
              rewardSource: 'referral'
            })
          }).then(() => {
            // 更新奖励数据
            fetchUserRewards();
            fetchRewardDetails(pagination.current, pagination.pageSize);
          }).catch(error => {
            console.error('更新奖励失败:', error);
          });
        }
      }
    }
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

  // 获取推荐人信息（从后端获取用户名和头像）
  const [referrerInfo, setReferrerInfo] = React.useState<any>(null);
  const [isReferrerLoading, setIsReferrerLoading] = React.useState(false);

  // 加载推荐人信息
  React.useEffect(() => {
    const loadReferrerInfo = async () => {
      if (!referrerAddress || referrerAddress === '0x0000000000000000000000000000000000000000') {
        setReferrerInfo(null);
        return;
      }

      setIsReferrerLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/users/${referrerAddress}`);
        if (response.ok) {
          const data = await response.json();
          setReferrerInfo(data);
        }
      } catch (error) {
        console.error('获取推荐人信息失败:', error);
        setReferrerInfo(null);
      } finally {
        setIsReferrerLoading(false);
      }
    };

    loadReferrerInfo();
  }, [referrerAddress]);

  // 获取直接推荐列表
  const [directReferrals, setDirectReferrals] = React.useState<Array<{ address: string; username?: string }>>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = React.useState(false);

  // 加载直接推荐列表
  const loadDirectReferrals = async () => {
    if (!isConnected || !userAddress) return;
    
    setIsLoadingReferrals(true);
    try {
      const referrals: Array<{ address: string; username?: string }> = [];
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

          if (referralAddress && referralAddress !== '0x0000000000000000000000000000000000000000') {
            // 获取推荐人的用户名
            try {
              const response = await fetch(`http://localhost:3001/api/users/${referralAddress}`);
              if (response.ok) {
                const data = await response.json();
                referrals.push({ 
                  address: referralAddress, 
                  username: data.username || undefined 
                });
              } else {
                referrals.push({ address: referralAddress, username: undefined });
              }
            } catch (error) {
              referrals.push({ address: referralAddress, username: undefined });
            }
          } else {
            break;
          }
        } catch (error) {
          break;
        }
        index++;
      }
      
      setDirectReferrals(referrals);
    } catch (error) {
      console.error('获取直接推荐列表失败:', error);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  // 组件挂载时加载直接推荐列表
  React.useEffect(() => {
    loadDirectReferrals();
  }, [isConnected, userAddress]);

  // 推荐树模态框状态
  const [treeModalVisible, setTreeModalVisible] = React.useState(false);
  const [treeData, setTreeData] = React.useState<any[]>([]);
  const [isLoadingTree, setIsLoadingTree] = React.useState(false);

  // 递归构建推荐树
  const buildReferralTree = async (address: string, depth: number = 0): Promise<any> => {
    // 获取地址对应的用户名
    let username = '';
    try {
      const response = await fetch(`http://localhost:3001/api/users/${address}`);
      if (response.ok) {
        const data = await response.json();
        username = data.username || '未设置用户名';
      } else {
        username = '未设置用户名';
      }
    } catch (error) {
      username = '未设置用户名';
    }
    
    const node: any = {
      title: username,
      key: address,
      children: [],
    };
    
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
        
        if (referralAddress && referralAddress !== '0x0000000000000000000000000000000000000000') {
          const childNode = await buildReferralTree(referralAddress, depth + 1);
          if (childNode) {
            node.children.push(childNode);
          }
        } else {
          break;
        }
      } catch (error) {
        break;
      }
      index++;
    }
    
    return node.children.length > 0 ? node : null;
  };

  // 打开推荐树模态框
  const handleViewReferralTree = async () => {
    if (!isConnected || !userAddress) return;
    
    setIsLoadingTree(true);
    setTreeModalVisible(true);
    
    try {
      const tree = await buildReferralTree(userAddress);
      if (tree) {
        setTreeData([tree]);
      } else {
        setTreeData([]);
      }
    } catch (error) {
      console.error('构建推荐树失败:', error);
      setTreeData([]);
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
    console.log('领取分红功能暂时禁用，等待Wagmi 2.0 API确认');
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

  // 格式化SCIA余额
  const formatSCIA = (amount: bigint | undefined): string => {
    if (!amount) return '0';
    return (Number(amount) / 10 ** 18).toFixed(6);
  };

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

  // 格式化日期
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '未注册';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // 格式化奖励金额
  const formatRewardAmount = (amount: string, type: string): string => {
    const numAmount = Number(amount) / 10 ** 18;
    return `${numAmount.toFixed(6)} ${type}`;
  };

  // 奖励类型标签
  const getRewardTypeTag = (type: string) => {
    switch (type) {
      case 'SCIA':
        return <Tag color="green">SCIA</Tag>;
      case 'USDT':
        return <Tag color="blue">USDT</Tag>;
      default:
        return <Tag color="default">{type}</Tag>;
    }
  };

  // 奖励来源标签
  const getRewardSourceTag = (source: string) => {
    switch (source) {
      case 'referral':
        return <Tag color="purple">推荐奖励</Tag>;
      case 'dividend':
        return <Tag color="orange">分红</Tag>;
      default:
        return <Tag color="default">其他</Tag>;
    }
  };
  
  // 处理头像文件选择
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        message.error('请选择图片文件');
        return;
      }
      
      // 检查文件大小（限制10MB）
      if (file.size > 10 * 1024 * 1024) {
        message.error('图片大小不能超过10MB');
        return;
      }
      
      setAvatarFile(file);
      
      // 生成预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 处理更换头像
  const handleChangeAvatar = async () => {
    if (!isConnected || !userAddress) {
      message.error('请先连接钱包');
      return;
    }
    
    if (!avatarFile) {
      message.error('请选择要上传的头像');
      return;
    }
    
    setIsUploadingAvatar(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await fetch(`http://localhost:3001/api/users/${userAddress}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        message.success('头像更新成功');
        // 刷新页面以获取最新数据
        window.location.reload();
      } else {
        const errorData = await response.json();
        message.error(errorData.message || '头像更新失败');
      }
    } catch (error) {
      console.error('更换头像失败:', error);
      message.error('网络错误，更换头像失败');
    } finally {
      setIsUploadingAvatar(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  // 奖励明细表格列
  const rewardDetailColumns = [
    {
      title: '奖励类型',
      dataIndex: 'rewardType',
      key: 'rewardType',
      render: (type: string) => getRewardTypeTag(type),
    },
    {
      title: '奖励金额',
      dataIndex: ['rewardAmount', 'rewardType'],
      key: 'rewardAmount',
      render: (values: [string, string]) => formatRewardAmount(values[0], values[1]),
      sorter: (a: any, b: any) => Number(a.rewardAmount) - Number(b.rewardAmount),
    },
    {
      title: '奖励来源',
      dataIndex: 'rewardSource',
      key: 'rewardSource',
      render: (source: string) => getRewardSourceTag(source),
    },
    {
      title: '相关地址',
      dataIndex: 'relatedAddress',
      key: 'relatedAddress',
      render: (address: string) => {
        if (!address) return '-';
        return `${address.slice(0, 8)}...${address.slice(-6)}`;
      },
    },
    {
      title: '交易哈希',
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      render: (hash: string) => {
        if (!hash) return '-';
        return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
      },
    },
    {
      title: '奖励时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

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
              {(avatarPreview || avatar) && (
                <img 
                  src={avatarPreview || avatar} 
                  alt="用户头像" 
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #1890ff'
                  }} 
                />
              )}
              {!avatarPreview && !avatar && (
                <span style={{ fontSize: '50px' }}>👤</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarFileChange} 
                style={{ display: 'none' }} 
                id="avatar-upload"
              />
              <label 
                htmlFor="avatar-upload"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  border: 'none',
                  display: 'inline-block',
                  textAlign: 'center'
                }}
              >
                选择头像
              </label>
              {avatarFile && (
                <Button
                  type="primary"
                  onClick={handleChangeAvatar}
                  loading={isUploadingAvatar}
                  size="small"
                >
                  确认更换
                </Button>
              )}
              {avatarPreview && !avatarFile && (
                <Button
                  type="default"
                  onClick={() => {
                    setAvatarPreview(null);
                    setAvatarFile(null);
                  }}
                  size="small"
                >
                  取消预览
                </Button>
              )}
            </div>
          </div>
          <div className="user-info">
            <p>用户名：{username || '未设置'}</p>
            <p>钱包地址：{isConnected ? userAddress?.slice(0, 10) + '...' + userAddress?.slice(-8) : '未连接'}</p>
            <p>注册时间：{formatDate(createdAt)}</p>
            <p>
              推荐人：
              {isReferrerLoading ? (
                <LoadingOutlined /> + ' 加载中...'
              ) : referrerAddress && referrerAddress !== '0x0000000000000000000000000000000000000000' ? (
                <span>
                  {referrerInfo?.username || '未设置用户名'}
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
            <h3>积分信息</h3>
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
        <div className="referral-info">
          <Tabs defaultActiveKey="promotion">
            <Tabs.TabPane tab="推广信息" key="promotion">
              <div className="referral-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <p>推广链接：</p>
                <input
                  type="text"
                  value={`https://scia-dapp.com?ref=${userAddress || '0x0000000000000000000000000000000000000000'}`}
                  readOnly
                  style={{
                    flex: 1,
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
              <div className="referral-qr" style={{ marginBottom: '16px' }}>
                <p>推广二维码：</p>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '16px' 
                }}>
                  <div className="qr-code" style={{ 
                    padding: '16px', 
                    backgroundColor: '#fff', 
                    borderRadius: '8px',
                    display: 'inline-block'
                  }}>
                    <QRCodeSVG 
                      value={`https://scia-dapp.com?ref=${userAddress || '0x0000000000000000000000000000000000000000'}`} 
                      size={200} 
                      level="H" 
                      includeMargin={true} 
                    />
                  </div>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      // 生成真实的二维码并下载
                      const qrValue = `https://scia-dapp.com?ref=${userAddress || '0x0000000000000000000000000000000000000000'}`;
                      
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
                          includeMargin: true,
                          bgColor: '#ffffff',
                          fgColor: '#000000'
                        })
                      );
                      
                      // 将HTML字符串转换为完整的SVG
                      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n${qrCodeHtml}`;
                      
                      // 创建Blob对象
                      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                      
                      // 创建下载链接
                      const downloadLink = document.createElement('a');
                      downloadLink.href = URL.createObjectURL(blob);
                      downloadLink.download = `SCIA推广二维码_${userAddress?.slice(0, 8) || 'unknown'}.svg`;
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
              <div className="direct-referrals">
                <h4>直接推荐（最近5人）</h4>
                {isLoadingReferrals ? (
                  <LoadingOutlined /> + ' 加载中...'
                ) : directReferrals.length > 0 ? (
                  <ul>
                    {directReferrals.map((referral, index) => (
                      <li key={index}>
                        <Badge status="success" /> {referral.username || '未设置用户名'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>暂无推荐记录</p>
                )}
              </div>
              <div className="total-rewards">
                <h4>总奖励</h4>
                <p>SCIA奖励：{formatSCIA(totalSCIA)}</p>
                <p>USDT奖励：{formatUSDT(totalUSDT)}</p>
              </div>
              <Button 
                type="primary" 
                className="view-all-referrals-btn"
                onClick={handleViewReferralTree}
                loading={isLoadingTree}
              >
                查询所有推荐树
              </Button>
            </Tabs.TabPane>
            <Tabs.TabPane tab="奖励明细" key="rewards">
              <div className="reward-details-container">
                <div className="reward-details-header">
                  <h4>奖励明细</h4>
                  <Button 
                    type="text" 
                    icon={<ReloadOutlined />} 
                    onClick={() => fetchRewardDetails()}
                    loading={isLoadingRewardDetails}
                    style={{ marginBottom: 16 }}
                  >
                    刷新
                  </Button>
                </div>
                <Table
                  columns={rewardDetailColumns}
                  dataSource={rewardDetails}
                  rowKey="_id"
                  loading={isLoadingRewardDetails}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: handlePageChange,
                  }}
                  bordered
                  scroll={{ x: 800 }}
                />
              </div>
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
            ) : treeData.length > 0 ? (
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
          </Modal>
      </section>
    </div>
  );
};

export default ProfilePage;
