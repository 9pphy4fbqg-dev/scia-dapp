const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 用户模型定义
const UserSchema = new mongoose.Schema({
  // 钱包地址（作为用户唯一标识）
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // 用户名
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  // 头像URL
  avatar: {
    type: String,
    default: ''
  },
  // 注册时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 上次修改时间
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // 上次修改用户名和头像的时间
  lastProfileUpdate: {
    type: Date,
    default: Date.now
  },
  // 推荐人地址
  referrerAddress: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  // 总奖励
  totalRewards: {
    // SCIA奖励（存储为wei值，1 SCIA = 10^18 wei）
    scia: {
      type: String,
      default: '0'
    },
    // USDT奖励（存储为wei值，1 USDT = 10^18 wei）
    usdt: {
      type: String,
      default: '0'
    }
  },
  // 用户状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  // 角色
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  // 最后登录时间
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      // 移除敏感字段
      delete ret.__v;
      return ret;
    }
  }
});

// 虚拟属性：注册天数
UserSchema.virtual('registrationDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 虚拟属性：是否可以修改个人信息（每7天允许修改一次）
UserSchema.virtual('canUpdateProfile').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.lastProfileUpdate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 7;
});

// 实例方法：更新用户信息
UserSchema.methods.updateProfile = async function(updates) {
  // 检查是否可以修改个人信息
  const now = new Date();
  const diffTime = Math.abs(now - this.lastProfileUpdate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) {
    throw new Error(`You can only update your profile once every 7 days. Please wait ${7 - diffDays} more days.`);
  }
  
  // 更新字段
  Object.keys(updates).forEach(key => {
    if (this.schema.paths[key]) {
      this[key] = updates[key];
    }
  });
  
  // 更新最后修改时间
  this.lastProfileUpdate = now;
  this.updatedAt = now;
  
  return await this.save();
};

// 实例方法：更新最后登录时间
UserSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

// 创建模型
const User = mongoose.model('User', UserSchema);

module.exports = User;
