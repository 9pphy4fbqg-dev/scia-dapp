const mongoose = require('mongoose');

// 奖励明细模型定义
const RewardDetailSchema = new mongoose.Schema({
  // 关联的用户钱包地址
  walletAddress: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    ref: 'User'
  },
  // 奖励类型（SCIA或USDT）
  rewardType: {
    type: String,
    enum: ['SCIA', 'USDT'],
    required: true
  },
  // 奖励金额（存储为wei值字符串）
  rewardAmount: {
    type: String,
    required: true
  },
  // 奖励来源（如：推荐奖励、分红等）
  rewardSource: {
    type: String,
    enum: ['referral', 'dividend', 'other'],
    default: 'referral'
  },
  // 相关交易哈希
  transactionHash: {
    type: String,
    trim: true,
    default: ''
  },
  // 相关用户地址（如：被推荐人地址）
  relatedAddress: {
    type: String,
    trim: true,
    default: ''
  },
  // 奖励产生时间
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

// 创建索引，提高查询性能
RewardDetailSchema.index({ walletAddress: 1, createdAt: -1 });
RewardDetailSchema.index({ transactionHash: 1 });

// 创建模型
const RewardDetail = mongoose.model('RewardDetail', RewardDetailSchema);

module.exports = RewardDetail;
