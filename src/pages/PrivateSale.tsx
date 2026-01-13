import React, { useState } from 'react';
import { Form, InputNumber, Input, Button, Card, Divider, Typography, message } from 'antd';
import { useAccount, useContractRead, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { globalDesign, globalStyles } from '../constants/globalDesign';
import { privateSaleAbi } from '../abi/privateSale';
import { usdtAbi } from '../abi/usdt';

const { Title, Text } = Typography;

// 获取合约地址
const PRIVATE_SALE_ADDRESS = import.meta.env.REACT_APP_TESTNET_PRIVATE_SALE_CONTRACT_ADDRESS as `0x${string}`;
const USDT_ADDRESS = import.meta.env.REACT_APP_TESTNET_USDT_ADDRESS as `0x${string}`;

const PrivateSalePage: React.FC = () => {
  const [form] = Form.useForm();
  const [packages, setPackages] = useState<number>(1);
  const { address: userAddress, isConnected } = useAccount();
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [approvalHash, setApprovalHash] = useState<string | undefined>(undefined);
  const [purchaseHash, setPurchaseHash] = useState<string | undefined>(undefined);
  
  // 保存购买信息，用于授权成功后的回调
  const [purchaseInfo, setPurchaseInfo] = useState<{
    packagesToBuy: number;
    referrer: string;
  }>({
    packagesToBuy: 1,
    referrer: ''
  });

  // 计算预估金额和代币数量
  const estimatedUSDT = packages * 0.01;
  const estimatedSCIA = packages * 1000;
  const requiredUSDTWei = BigInt(Math.ceil(estimatedUSDT * 10 ** 18)); // USDT使用18位小数（BSC Testnet）

  // 获取USDT余额
  const { data: usdtBalance, isLoading: isUSDTBalanceLoading } = useContractRead({
    address: USDT_ADDRESS,
    abi: usdtAbi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!isConnected && !!userAddress, // 只有连接且有地址时才查询
      refetchInterval: 30000, // 每30秒刷新一次
      refetchOnMount: true, // 挂载时重新查询
      refetchOnReconnect: true, // 重新连接时查询
      refetchOnWindowFocus: true, // 窗口聚焦时查询
    },
  });

  // 获取USDT授权额度
  const { data: usdtAllowance, isLoading: isUSDTAllowanceLoading } = useContractRead({
    address: USDT_ADDRESS,
    abi: usdtAbi,
    functionName: 'allowance',
    args: [userAddress as `0x${string}`, PRIVATE_SALE_ADDRESS as `0x${string}`],
    query: {
      enabled: !!isConnected && !!userAddress, // 只有连接且有地址时才查询
      refetchInterval: 30000, // 每30秒刷新一次
      refetchOnMount: true, // 挂载时重新查询
      refetchOnReconnect: true, // 重新连接时查询
      refetchOnWindowFocus: true, // 窗口聚焦时查询
    },
  });

  // 获取合约状态
  const { data: isPaused } = useContractRead({
    address: PRIVATE_SALE_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'isPaused',
    query: {
      enabled: !!isConnected,
      refetchInterval: 10000, // 每10秒刷新一次
    },
  });

  const { data: isEnded } = useContractRead({
    address: PRIVATE_SALE_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'isEnded',
    query: {
      enabled: !!isConnected,
      refetchInterval: 10000, // 每10秒刷新一次
    },
  });

  // 获取私募池信息
  const { data: poolInfo } = useContractRead({
    address: PRIVATE_SALE_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'getPoolInfo',
    query: {
      enabled: !!isConnected,
      refetchInterval: 10000, // 每10秒刷新一次
    },
  });

  // 检查私募池余额是否足够
  const isPoolBalanceSufficient = (packagesToBuy: number): boolean => {
    if (!poolInfo) return true; // 初始状态下允许提交，后续会检查
    
    const sciaAmount = BigInt(packagesToBuy) * 1000n * 10n ** 18n; // 1000 SCIA per package, converted to wei
    return poolInfo[0] >= sciaAmount; // poolInfo[0] is remainingPrivateSale
  };

  // 检查USDT余额是否足够
  const isBalanceSufficient = (): boolean => {
    if (!usdtBalance) return true; // 初始状态下允许提交，后续会检查
    const balance = Number(usdtBalance) / 10 ** 18; // USDT使用18位小数（BSC Testnet）
    return balance >= estimatedUSDT;
  };

  // 检查USDT授权是否足够
  const isAllowanceSufficient = (): boolean => {
    if (usdtAllowance === undefined) return true; // 初始状态下允许提交，后续会检查
    return usdtAllowance >= requiredUSDTWei;
  };

  // 获取钱包客户端
  const { data: walletClient } = useWalletClient();
  const [isApproving, setIsApproving] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // 购买代币方法
  const handleBuyTokens = async (packagesToBuy: number, referrer: string) => {
    try {
      setTransactionStatus('正在提交购买请求...');
      setIsBuying(true);

      // 检查钱包客户端
      if (!walletClient) {
        throw new Error('钱包客户端未连接');
      }
      
      // 调用购买方法
      const hash = await walletClient.writeContract({
        abi: privateSaleAbi,
        address: PRIVATE_SALE_ADDRESS,
        functionName: 'buyTokens',
        args: [
          BigInt(packagesToBuy), 
          referrer ? (referrer as `0x${string}`) : '0x0000000000000000000000000000000000000000' as `0x${string}`
        ],
      });

      setPurchaseHash(hash);
      setTransactionStatus(`购买请求已提交，交易哈希：${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`);
    } catch (error: any) {

      let errorMessage = '购买失败，请稍后重试';
      
      // 处理常见错误
      if (error.code === 4001) {
        errorMessage = '用户拒绝了交易';
      } else if (error.code === -32603) {
        errorMessage = '网络或节点错误，请重试';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'USDT余额不足';
      } else if (error.message?.includes('reverted')) {
        errorMessage = '交易被合约拒绝，请检查输入参数';
      } else if (error.message?.includes('钱包客户端未连接')) {
        errorMessage = '钱包客户端未连接，请检查连接状态';
      }
      
      message.error(errorMessage);
      setTransactionStatus('');
    } finally {
      setIsBuying(false);
    }
  };

  // 监听授权交易确认
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed, isError: isApprovalFailed, error: approvalError } = useWaitForTransactionReceipt({
    hash: approvalHash as `0x${string}` | undefined,
    query: {
      enabled: !!approvalHash,
    },
  });

  // 监听购买交易确认
  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseConfirmed, isError: isPurchaseFailed, error: purchaseError } = useWaitForTransactionReceipt({
    hash: purchaseHash as `0x${string}` | undefined,
    query: {
      enabled: !!purchaseHash,
    },
  });

  // 监听购买交易结果
  React.useEffect(() => {
    if (isPurchaseConfirmed && purchaseHash) {
      setTransactionStatus('');
      message.success(`购买成功！交易已确认\n交易哈希: ${purchaseHash.substring(0, 10)}...${purchaseHash.substring(purchaseHash.length - 8)}`);
      // 购买成功后，重置表单
      form.resetFields(['packages', 'referrer']);
      // 重置交易相关状态
      setPurchaseHash(undefined);
      // 刷新页面以获取最新数据
      window.location.reload();
    }
    
    if (isPurchaseFailed && purchaseHash) {
      setTransactionStatus('');
      message.error(`购买失败: ${purchaseError?.message || '未知错误'}\n交易哈希: ${purchaseHash.substring(0, 10)}...${purchaseHash.substring(purchaseHash.length - 8)}`);
      // 重置交易相关状态
      setPurchaseHash(undefined);
    }
  }, [isPurchaseConfirmed, isPurchaseFailed, purchaseError, form, purchaseHash]);

  // 监听授权交易结果
  React.useEffect(() => {
    if (isApprovalConfirmed && approvalHash) {
      message.success(`USDT授权成功！\n交易哈希: ${approvalHash.substring(0, 10)}...${approvalHash.substring(approvalHash.length - 8)}`);
      setTransactionStatus('USDT授权成功，正在准备购买...');
      // 授权成功后，自动调用购买方法，使用保存的购买信息
      handleBuyTokens(purchaseInfo.packagesToBuy, purchaseInfo.referrer);
      // 重置授权交易哈希，避免重复触发
      setApprovalHash(undefined);
    }
    
    if (isApprovalFailed && approvalHash) {
      setTransactionStatus('');
      message.error(`USDT授权失败: ${approvalError?.message || '未知错误'}\n交易哈希: ${approvalHash.substring(0, 10)}...${approvalHash.substring(approvalHash.length - 8)}`);
      // 重置授权交易哈希，避免重复触发
      setApprovalHash(undefined);
    }
  }, [isApprovalConfirmed, isApprovalFailed, approvalError, handleBuyTokens, purchaseInfo, approvalHash]);

  // 表单提交处理
  const handleSubmit = async (values: any) => {
    try {
      // 防止在授权或购买进行中重复提交
      if (isApproving || isBuying) {
        message.info('操作正在进行中，请稍候...');
        return;
      }
      
      setTransactionStatus('正在检查余额和授权...');
      
      // 获取表单中的最新值
      const packagesToBuy = values.packages || packages;
      const referrer = values.referrer || '';
      
      // 重新计算所需USDT
      const updatedEstimatedUSDT = packagesToBuy * 0.01;
      const updatedRequiredUSDTWei = BigInt(Math.ceil(updatedEstimatedUSDT * 10 ** 18)); // USDT使用18位小数（BSC Testnet）
      








      
      // 检查钱包连接
      if (!isConnected || !userAddress) {
        message.error('请先连接钱包');
        setTransactionStatus('');
        return;
      }

      // 检查合约状态
      if (isPaused) {
        message.error('私募销售已暂停，请稍后重试');
        setTransactionStatus('');
        return;
      }

      if (isEnded) {
        message.error('私募销售已结束，无法继续购买');
        setTransactionStatus('');
        return;
      }

      // 检查购买份数
      if (!packagesToBuy || packagesToBuy < 1 || packagesToBuy > 1000) {
        message.error('购买份数必须在1到1000之间');
        setTransactionStatus('');
        return;
      }

      // 检查余额（只在usdtBalance存在时检查）
      if (usdtBalance) {
        const balanceInUSDT = Number(usdtBalance) / 10 ** 18; // USDT使用18位小数（BSC Testnet）
        if (balanceInUSDT < updatedEstimatedUSDT) {
          message.error('USDT余额不足');
          setTransactionStatus('');
          return;
        }
      }

      // 检查私募池余额是否足够
      if (poolInfo && !isPoolBalanceSufficient(packagesToBuy)) {
        message.error('私募池余额不足，无法完成购买');
        setTransactionStatus('');
        return;
      }

      // 检查授权（当usdtAllowance不存在、为0或不足时，都需要请求授权）
      // 只有当授权不足且没有正在进行的授权请求时，才请求授权
      if ((usdtAllowance === undefined || usdtAllowance === 0n || usdtAllowance < updatedRequiredUSDTWei) && !approvalHash) {
        setTransactionStatus('USDT授权不足，正在请求授权...');
        setIsApproving(true);

        // 检查钱包客户端
        if (!walletClient) {
          message.error('钱包客户端未连接');
          setTransactionStatus('');
          setIsApproving(false);
          return;
        }

        // 请求授权 - 使用较大金额，避免频繁授权
        const hash = await walletClient.writeContract({
          abi: usdtAbi,
          address: USDT_ADDRESS,
          functionName: 'approve',
          args: [
            PRIVATE_SALE_ADDRESS as `0x${string}`, 
            BigInt(10 ** 18) // 授权1个USDT，足够多次购买
          ],
        });

        // 保存当前购买信息到状态，以便授权成功后使用
        setPurchaseInfo({ packagesToBuy, referrer });
        setApprovalHash(hash);
        message.success('USDT授权请求已提交，正在等待区块链确认...');
        setIsApproving(false);
        return;
      }

      // 授权足够，直接购买
      handleBuyTokens(packagesToBuy, referrer);
    } catch (error: any) {

      let errorMessage = '操作失败，请稍后重试';
      
      // 处理常见错误
      if (error.code === 4001) {
        errorMessage = '用户拒绝了操作';
      } else if (error.code === -32603) {
        errorMessage = '网络或节点错误，请重试';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'USDT余额不足';
      } else if (error.message?.includes('reverted')) {
        errorMessage = '交易被合约拒绝，请检查输入参数';
      }
      
      message.error(errorMessage);
      setTransactionStatus('');
    }
  };

  return (
    <div style={{
      maxWidth: globalDesign.layout.maxWidth,
      margin: '0 auto',
      backgroundColor: '#000000',
      padding: '16px',
    }}>
      {/* 调试信息 */}
      <div style={{ 
        padding: '8px 16px', 
        backgroundColor: 'rgba(0, 0, 255, 0.1)', 
        borderRadius: '4px', 
        marginBottom: '16px',
        fontSize: '12px',
        color: '#fff'
      }}>
        <div>钱包连接状态: {isConnected ? '已连接' : '未连接'}</div>
        <div>用户地址: {userAddress || '无'}</div>
        <div>usdtBalance: {usdtBalance ? Number(usdtBalance) / 10 ** 18 : '未获取'}</div>
        <div>usdtAllowance: {usdtAllowance ? Number(usdtAllowance) / 10 ** 18 : '未获取'}</div>
        <div>合约状态: {isPaused ? '暂停' : '正常'} | {isEnded ? '已结束' : '进行中'}</div>
      </div>
      
      <Title level={2} style={{
        ...globalStyles.title,
        marginBottom: globalDesign.spacing.marginBottom,
        textAlign: globalDesign.layout.textAlign,
        color: globalDesign.colors.text,
      }}>
        SCIA 私募销售
      </Title>

      <Card 
        style={{
          ...globalStyles.card,
          backgroundColor: globalDesign.colors.cardBackground,
          color: globalDesign.colors.text,
        }}
        bodyStyle={{
          padding: globalDesign.spacing.cardPadding,
          backgroundColor: globalDesign.colors.cardBackground,
          color: globalDesign.colors.text,
        }}
      >
        {/* 私募信息 */}
        <div style={{
          marginBottom: globalDesign.spacing.marginBottom,
          padding: globalDesign.spacing.padding,
          backgroundColor: globalDesign.colors.background,
          borderRadius: globalDesign.borders.borderRadius,
          border: `${globalDesign.borders.borderWidth} ${globalDesign.borders.borderStyle} ${globalDesign.colors.border}`,
        }}>
          <Text style={{ color: globalDesign.colors.textSecondary, marginRight: '16px' }}>
            价格：0.00001 USDT / SCIA
          </Text>
          <br />
          <Text style={{ color: globalDesign.colors.textSecondary, marginRight: '16px' }}>
            每包：1000 SCIA (0.01 USDT)
          </Text>
          <br />
          <Text style={{ color: globalDesign.colors.textSecondary, marginRight: '16px' }}>
            最小购买：1 包
          </Text>
          <br />
          <Text style={{ color: globalDesign.colors.textSecondary }}>
            最大购买：1000 包
          </Text>
        </div>

        <Divider style={{ borderColor: globalDesign.colors.border }} />

        {/* 购买表单 */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{ packages: 1 }}
          onFinish={handleSubmit}
          style={{ width: '100%' }}
        >
          <Form.Item
            name="packages"
            label="购买份数"
            rules={[
              { required: true, message: '请输入购买份数' },
              { type: 'number', min: 1, max: 1000, message: '购买份数必须在1到1000之间' },
            ]}
            labelCol={{ style: { color: globalDesign.colors.text } }}
            validateTrigger={['onBlur', 'onChange']}
          >
            <InputNumber
              min={1}
              max={1000}
              defaultValue={1}
              onChange={(value) => setPackages(value || 1)}
              style={{
                width: '100%',
                backgroundColor: globalDesign.colors.inputBackground,
                borderColor: globalDesign.colors.border,
                color: globalDesign.colors.text,
                borderRadius: globalDesign.borders.borderRadius,
              }}
              formatter={(value) => `${value}`}
              parser={(value) => parseInt(value || '1', 10) as any}
            />
          </Form.Item>

          <Form.Item
            name="referrer"
            label="推荐人地址 (可选)"
            labelCol={{ style: { color: globalDesign.colors.text } }}
            rules={[
              { 
                pattern: /^0x[a-fA-F0-9]{40}$|^$/, 
                message: '请输入有效的推荐人钱包地址'
              }
            ]}
          >
            <Input
              placeholder="请输入推荐人钱包地址"
              style={{
                backgroundColor: globalDesign.colors.inputBackground,
                borderColor: globalDesign.colors.border,
                color: globalDesign.colors.text,
                borderRadius: globalDesign.borders.borderRadius,
              }}
            />
          </Form.Item>

          <Form.Item>
            <div style={{
              padding: globalDesign.spacing.padding,
              backgroundColor: 'rgba(82, 196, 26, 0.1)',
              borderRadius: globalDesign.borders.borderRadius,
              border: `${globalDesign.borders.borderWidth} ${globalDesign.borders.borderStyle} ${globalDesign.colors.success}`,
              marginBottom: globalDesign.spacing.marginBottom,
            }}>
              <Text strong style={{ color: globalDesign.colors.success }}>
                预估金额：{estimatedUSDT} USDT
              </Text>
              <br />
              <Text strong style={{ color: globalDesign.colors.success }}>
                预估代币数量：{estimatedSCIA} SCIA
              </Text>
              {isConnected && (
                <>
                  <br />
                  <Text style={{ color: globalDesign.colors.textSecondary }}>
                    {isUSDTBalanceLoading ? '加载USDT余额中...' : `USDT余额：${usdtBalance ? (Number(usdtBalance) / 10 ** 18).toFixed(4) : '0'} USDT`}
                    {typeof usdtBalance === 'bigint' && !isBalanceSufficient() && (
                      <Text style={{ color: globalDesign.colors.danger, marginLeft: '8px' }}>
                        （余额不足）
                      </Text>
                    )}
                  </Text>
                  <br />
                  <Text style={{ color: globalDesign.colors.textSecondary }}>
                    {isUSDTAllowanceLoading ? '加载USDT授权中...' : `USDT授权：${usdtAllowance ? (Number(usdtAllowance) / 10 ** 18).toFixed(4) : '0'} USDT`}
                    {typeof usdtAllowance === 'bigint' && !isAllowanceSufficient() && (
                      <Text style={{ color: globalDesign.colors.warning, marginLeft: '8px' }}>
                        （授权不足）
                      </Text>
                    )}
                  </Text>
                </>
              )}
            </div>
          </Form.Item>

          {/* 交易状态显示 */}
          {transactionStatus && (
            <div style={{
              padding: globalDesign.spacing.padding,
              backgroundColor: 'rgba(24, 144, 255, 0.1)',
              borderRadius: globalDesign.borders.borderRadius,
              border: `${globalDesign.borders.borderWidth} ${globalDesign.borders.borderStyle} ${globalDesign.colors.primary}`,
              marginBottom: globalDesign.spacing.marginBottom,
            }}>
              <Text strong style={{ color: globalDesign.colors.primary }}>
                {transactionStatus}
              </Text>
              {approvalHash && (
                <>
                  <br />
                  <Text style={{ fontSize: '12px', color: globalDesign.colors.textSecondary }}>
                    授权交易哈希：{approvalHash}
                  </Text>
                </>
              )}
              {purchaseHash && (
                <>
                  <br />
                  <Text style={{ fontSize: '12px', color: globalDesign.colors.textSecondary }}>
                    购买交易哈希：{purchaseHash}
                  </Text>
                </>
              )}
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                ...globalStyles.buttonPrimary,
                width: '100%',
                padding: globalDesign.button.padding,
                fontSize: globalDesign.button.fontSize,
                borderRadius: globalDesign.borders.borderRadius,
                fontWeight: globalDesign.typography.fontWeightBold,
              }}
              disabled={!isConnected || isPaused || isEnded}
              loading={isApproving || isBuying || isApprovalConfirming || isPurchaseConfirming}
            >
              {!isConnected ? '连接钱包购买' : 
               isPaused ? '销售已暂停' : 
               isEnded ? '销售已结束' : 
               isApproving || isApprovalConfirming ? 'USDT授权中...' : 
               isBuying || isPurchaseConfirming ? '购买中...' : 
               '立即购买'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PrivateSalePage;
