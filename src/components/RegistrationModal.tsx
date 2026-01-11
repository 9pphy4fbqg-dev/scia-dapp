import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useAccount, useWalletClient, useWaitForTransactionReceipt } from 'wagmi';
import { AppDispatch, RootState } from '../app/store';
import { setShowRegistrationModal, setUserRegistered, setUserInfo } from '../features/user';
import { referralCenterAbi } from '../abi/referralCenter';

const RegistrationModal: React.FC = () => {
  const [form] = Form.useForm();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { address: userAddress, isConnected } = useAccount();
  const dispatch = useDispatch<AppDispatch>();
  
  const { showRegistrationModal } = useSelector(
    (state: RootState) => state.user
  );
  
  // 获取推荐中心合约地址
  const REFERRAL_CENTER_ADDRESS = import.meta.env.REACT_APP_TESTNET_REFERRAL_CENTER_ADDRESS as `0x${string}`;
  
  // 获取钱包客户端
  const { data: walletClient } = useWalletClient();
  
  // 推荐关系注册交易哈希
  const [registerReferralHash, setRegisterReferralHash] = useState<`0x${string}` | undefined>(undefined);
  
  // 等待推荐关系注册交易确认
  const { isSuccess: isReferralRegistered } = useWaitForTransactionReceipt({
    hash: registerReferralHash,
  });
  
  // 处理URL参数中的推荐人地址
  useEffect(() => {
    if (isConnected && userAddress) {
      // 检查URL参数
      const urlParams = new URLSearchParams(window.location.search);
      const referrer = urlParams.get('ref');
      
      // 如果存在有效的推荐人地址且不是当前用户，自动填充到表单
      if (referrer && referrer !== userAddress && referrer.startsWith('0x')) {
        form.setFieldValue('referrerAddress', referrer);
        
        // 调用合约注册推荐关系
        const registerReferral = async () => {
          try {
            if (!walletClient) {
              throw new Error('钱包客户端未连接');
            }
            
            const hash = await walletClient.writeContract({
              abi: referralCenterAbi,
              address: REFERRAL_CENTER_ADDRESS,
              functionName: 'registerReferral',
              args: [referrer as `0x${string}`],
            });
            
            setRegisterReferralHash(hash);
          } catch (error) {
            console.error('推荐关系注册失败:', error);
            message.error('推荐关系注册失败，请稍后重试');
          }
        };
        
        registerReferral();
      }
    }
  }, [isConnected, userAddress, form, walletClient]);
  
  // 推荐关系注册成功提示
  useEffect(() => {
    if (isReferralRegistered) {
      message.success('推荐关系注册成功！');
    }
  }, [isReferralRegistered]);

  // 将文件转换为Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // 处理注册表单提交
  const handleSubmit = async (values: any) => {
    if (!isConnected || !userAddress) {
      message.error('请先连接钱包');
      return;
    }

    setIsSubmitting(true);

    try {
      // 处理头像
      let avatarBase64 = '';
      if (avatarFile) {
        avatarBase64 = await fileToBase64(avatarFile);
      }

      // 调用注册API
      const response = await fetch('http://localhost:3001/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: userAddress,
          username: values.username,
          avatar: avatarBase64,
          referrerAddress: values.referrerAddress || '',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '注册失败');
      }
      
      await response.json();
      message.success('注册成功！');
      
      // 获取最新的用户信息
      const userInfoResponse = await fetch(`http://localhost:3001/api/users/${userAddress}`);
      const userData = await userInfoResponse.json();
      
      if (userData.username) {
        // 更新用户信息到Redux状态
        dispatch(setUserRegistered(true));
        dispatch(setUserInfo({
          username: userData.username,
          avatar: userData.avatar,
          createdAt: userData.registeredAt,
          lastProfileUpdate: userData.lastProfileUpdateAt
        }));
      }
      
      // 关闭模态框
      dispatch(setShowRegistrationModal(false));
      
      // 重置表单
      form.resetFields();
      setAvatarFile(null);
    } catch (err) {
      message.error((err as Error).message || '注册失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理模态框关闭
  const handleCancel = () => {
    dispatch(setShowRegistrationModal(false));
    form.resetFields();
    setAvatarFile(null);
  };

  return (
    <Modal
      title="用户注册"
      open={showRegistrationModal}
      onCancel={handleCancel}
      footer={null}
      width={500}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          referrerAddress: '',
        }}
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 2, max: 50, message: '用户名长度必须在2到50个字符之间' },
          ]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item
          name="referrerAddress"
          label="推荐人地址（可选）"
          rules={[
            {
              pattern: /^0x[a-fA-F0-9]{40}$|^$/, 
              message: '请输入有效的钱包地址或留空'
            }
          ]}
        >
          <Input placeholder="请输入推荐人钱包地址，或留空" />
        </Form.Item>

        <Form.Item
          name="avatar"
          label="头像（可选）"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* 头像预览 */}
            <div style={{ 
              width: 100, 
              height: 100, 
              borderRadius: '50%', 
              overflow: 'hidden', 
              marginBottom: 16, 
              border: '2px dashed #d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {avatarFile ? (
                <img 
                  src={URL.createObjectURL(avatarFile)} 
                  alt="头像预览" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <UploadOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
              )}
            </div>
            
            {/* 文件选择按钮 */}
            <input
              type="file"
              id="avatar-upload"
              accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.svu"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // 检查文件大小
                  const isLt10M = file.size / 1024 / 1024 < 10;
                  if (!isLt10M) {
                    message.error('图片大小不能超过10MB！');
                    return;
                  }
                  
                  setAvatarFile(file);
                  message.success(`${file.name} 选择成功`);
                }
              }}
            />
            
            {/* 使用简单的按钮样式，避免Button组件可能的事件阻止 */}
            <button
              type="button"
              onClick={() => {
                document.getElementById('avatar-upload')?.click();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                backgroundColor: '#1890ff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#40a9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1890ff';
              }}
            >
              <UploadOutlined style={{ marginRight: 8 }} />
              选择头像
            </button>
            
            {/* 清除按钮 */}
            {avatarFile && (
              <Button 
                type="text" 
                danger 
                style={{ marginTop: 8, cursor: 'pointer' }}
                onClick={() => {
                  setAvatarFile(null);
                  message.success('已清除头像');
                }}
              >
                清除
              </Button>
            )}
          </div>
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting}
            style={{ width: '100%' }}
          >
            注册
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RegistrationModal;