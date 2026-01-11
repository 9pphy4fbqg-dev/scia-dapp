const User = require('../models/User');
const RewardDetail = require('../models/RewardDetail');
const fs = require('fs');
const path = require('path');

/**
 * @desc 用户注册
 * @route POST /api/users/register
 * @access Public
 */
exports.registerUser = async (req, res) => {
  try {
    const { walletAddress, username, referrerAddress } = req.body;

    // 验证必填字段
    if (!walletAddress || !username) {
      return res.status(400).json({
        status: 'error',
        message: '钱包地址和用户名不能为空'
      });
    }

    // 检查钱包地址是否已注册
    const existingUser = await User.findOne({ walletAddress });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: '该钱包地址已注册'
      });
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        status: 'error',
        message: '该用户名已存在'
      });
    }

    // 创建新用户
    const newUser = new User({
      walletAddress,
      username,
      referrerAddress: referrerAddress || ''
    });

    // 保存用户
    await newUser.save();

    return res.status(201).json({
      status: 'success',
      message: '用户注册成功',
      data: newUser
    });
  } catch (error) {
    console.error('注册用户错误:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '服务器内部错误'
    });
  }
};

/**
 * @desc 用户登录
 * @route POST /api/users/login
 * @access Public
 */
exports.loginUser = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    // 验证必填字段
    if (!walletAddress) {
      return res.status(400).json({
        status: 'error',
        message: '钱包地址不能为空'
      });
    }

    // 查找用户
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户未注册'
      });
    }

    // 更新最后登录时间
    user.lastLogin = Date.now();
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: '登录成功',
      data: user
    });
  } catch (error) {
    console.error('登录用户错误:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '服务器内部错误'
    });
  }
};

/**
 * @desc 获取用户信息
 * @route GET /api/users/:walletAddress
 * @access Public
 */
exports.getUserInfo = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // 查找用户
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户未注册'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: '获取用户信息成功',
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '服务器内部错误'
    });
  }
};

/**
 * @desc 更新用户信息
 * @route PUT /api/users/:walletAddress
 * @access Public
 */
exports.updateUserInfo = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { username } = req.body;

    // 查找用户
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户未注册'
      });
    }

    // 如果要更新用户名，检查是否已存在
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          status: 'error',
          message: '该用户名已存在'
        });
      }
    }

    // 检查是否可以修改个人信息（每7天允许修改一次）
    const now = new Date();
    const diffTime = Math.abs(now - user.lastProfileUpdate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return res.status(400).json({
        status: 'error',
        message: `每7天只能修改一次个人信息，还需等待 ${7 - diffDays} 天`
      });
    }

    // 更新用户信息
    if (username) user.username = username;
    if (req.file) {
      // 删除旧头像
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '../uploads', user.avatar.split('/').pop());
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      // 设置新头像URL
      user.avatar = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    // 更新最后修改时间
    user.lastProfileUpdate = now;
    user.updatedAt = now;

    // 保存用户
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: '用户信息更新成功',
      data: user
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '服务器内部错误'
    });
  }
};

/**
 * @desc 获取用户列表
 * @route GET /api/users
 * @access Private (Admin)
 */
exports.getUserList = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // 获取用户列表
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // 获取总用户数
    const totalUsers = await User.countDocuments();

    return res.status(200).json({
      status: 'success',
      message: '获取用户列表成功',
      data: {
        users,
        pagination: {
          total: totalUsers,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalUsers / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '服务器内部错误'
    });
  }
};

/**
 * @desc 删除用户
 * @route DELETE /api/users/:id
 * @access Private (Admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 查找用户
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    // 删除头像
    if (user.avatar) {
      const avatarPath = path.join(__dirname, '../uploads', user.avatar.split('/').pop());
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // 删除用户
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'success',
      message: '删除用户成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '服务器内部错误'
    });
  }
};

/**
 * @desc 更新用户总奖励
 * @route PUT /api/users/:walletAddress/rewards
 * @access Public
 */
exports.updateUserRewards = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { sciaReward, usdtReward, transactionHash, relatedAddress, rewardSource = 'referral' } = req.body;

    // 验证必填字段
    if (!sciaReward || !usdtReward) {
      return res.status(400).json({
        status: 'error',
        message: 'SCIA奖励和USDT奖励不能为空'
      });
    }

    // 查找用户
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户未注册'
      });
    }

    // 更新总奖励
    const currentSCIA = BigInt(user.totalRewards.scia);
    const currentUSDT = BigInt(user.totalRewards.usdt);
    const newSCIA = currentSCIA + BigInt(sciaReward);
    const newUSDT = currentUSDT + BigInt(usdtReward);

    user.totalRewards.scia = newSCIA.toString();
    user.totalRewards.usdt = newUSDT.toString();
    user.updatedAt = new Date();

    // 保存用户
    await user.save();

    // 创建奖励明细记录
    const rewardDetails = [];

    // 创建SCIA奖励明细
    if (BigInt(sciaReward) > 0n) {
      const sciaDetail = new RewardDetail({
        walletAddress,
        rewardType: 'SCIA',
        rewardAmount: sciaReward,
        rewardSource,
        transactionHash,
        relatedAddress
      });
      rewardDetails.push(await sciaDetail.save());
    }

    // 创建USDT奖励明细
    if (BigInt(usdtReward) > 0n) {
      const usdtDetail = new RewardDetail({
        walletAddress,
        rewardType: 'USDT',
        rewardAmount: usdtReward,
        rewardSource,
        transactionHash,
        relatedAddress
      });
      rewardDetails.push(await usdtDetail.save());
    }

    return res.status(200).json({
      status: 'success',
      message: '更新用户总奖励成功',
      data: {
        user,
        rewardDetails
      }
    });
  } catch (error) {
    console.error('更新用户总奖励错误:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '服务器内部错误'
    });
  }
};

/**
 * @desc 获取用户奖励明细
 * @route GET /api/users/:walletAddress/reward-details
 * @access Public
 */
exports.getUserRewardDetails = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { page = 1, limit = 10, rewardType, rewardSource } = req.query;

    // 验证用户是否存在
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户未注册'
      });
    }

    // 构建查询条件
    const query = {
      walletAddress
    };

    // 添加奖励类型过滤
    if (rewardType) {
      query.rewardType = rewardType;
    }

    // 添加奖励来源过滤
    if (rewardSource) {
      query.rewardSource = rewardSource;
    }

    // 计算分页参数
    const skip = (page - 1) * limit;

    // 查询奖励明细
    const rewardDetails = await RewardDetail.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // 查询总数
    const total = await RewardDetail.countDocuments(query);

    return res.status(200).json({
      status: 'success',
      message: '获取用户奖励明细成功',
      data: {
        rewardDetails,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户奖励明细错误:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '服务器内部错误'
    });
  }
};
