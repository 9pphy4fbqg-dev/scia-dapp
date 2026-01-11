const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

// 注册路由
router.post('/register', userController.registerUser);

// 登录路由
router.post('/login', userController.loginUser);

// 获取用户信息路由
router.get('/:walletAddress', userController.getUserInfo);

// 更新用户信息路由（支持头像上传）
router.put('/:walletAddress', upload.single('avatar'), userController.updateUserInfo);

// 更新用户总奖励路由
router.put('/:walletAddress/rewards', userController.updateUserRewards);

// 获取用户奖励明细路由
router.get('/:walletAddress/reward-details', userController.getUserRewardDetails);

// 获取用户列表路由（管理员）
router.get('/', userController.getUserList);

// 删除用户路由（管理员）
router.delete('/:id', userController.deleteUser);

module.exports = router;
