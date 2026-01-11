const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 设置中间件
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 设置速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 创建SQLite数据库连接
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // 检查并创建用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
      walletAddress TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      avatar TEXT,
      referrerAddress TEXT,
      registered INTEGER NOT NULL DEFAULT 0,
      registeredAt TEXT,
      updatedAt TEXT,
      lastProfileUpdateAt TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Users table is ready.');
      }
    });
  }
});

// API路由

// 注册用户
app.post('/api/users/register', (req, res) => {
  const { walletAddress, username, avatar, referrerAddress } = req.body;
  const registeredAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();
  const registered = 1;

  const sql = `INSERT OR REPLACE INTO users (walletAddress, username, avatar, referrerAddress, registered, registeredAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [walletAddress, username, avatar || '', referrerAddress || '', registered, registeredAt, updatedAt], function(err) {
    if (err) {
      return res.status(500).json({ 
        status: 'error',
        message: err.message 
      });
    }
    res.status(201).json({ 
      status: 'success',
      message: '用户注册成功', 
      data: { walletAddress, username, avatar }
    });
  });
});

// 登录用户
app.post('/api/users/login', (req, res) => {
  const { walletAddress } = req.body;

  // 查找用户
  const sql = `SELECT * FROM users WHERE walletAddress = ?`;

  db.get(sql, [walletAddress], (err, user) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error',
        message: err.message 
      });
    }
    if (!user) {
      return res.status(404).json({ 
        status: 'error',
        message: '用户未注册' 
      });
    }

    res.status(200).json({ 
      status: 'success',
      message: '登录成功', 
      data: user 
    });
  });
});

// 获取用户信息
app.get('/api/users/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  const sql = `SELECT * FROM users WHERE walletAddress = ?`;

  db.get(sql, [walletAddress], (err, row) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error',
        message: err.message 
      });
    }
    if (!row) {
      return res.status(404).json({ 
        status: 'error',
        message: '用户未注册' 
      });
    }
    res.status(200).json(row);
  });
});

// 更新用户信息 - 添加7天冷却时间
app.put('/api/users/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  const { username, avatar } = req.body;
  const now = new Date();
  const updatedAt = now.toISOString();
  
  // 首先查询用户当前信息，检查冷却时间
  db.get('SELECT lastProfileUpdateAt, username, avatar FROM users WHERE walletAddress = ?', [walletAddress], (err, user) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error',
        message: err.message 
      });
    }
    
    // 检查用户是否存在
    if (!user) {
      return res.status(404).json({ 
        status: 'error',
        message: '用户未注册' 
      });
    }
    
    // 检查冷却时间：7天 = 7 * 24 * 60 * 60 * 1000 = 604800000毫秒
    const COOLDOWN_PERIOD = 7 * 24 * 60 * 60 * 1000;
    if (user.lastProfileUpdateAt) {
      const lastUpdateTime = new Date(user.lastProfileUpdateAt).getTime();
      const timeSinceLastUpdate = now.getTime() - lastUpdateTime;
      
      if (timeSinceLastUpdate < COOLDOWN_PERIOD) {
        // 计算剩余冷却时间（毫秒转换为天）
        const remainingTime = COOLDOWN_PERIOD - timeSinceLastUpdate;
        const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
        return res.status(400).json({ 
          status: 'error',
          message: `每7天只能修改一次个人信息，还需等待 ${remainingDays} 天`
        });
      }
    }
    
    // 检查用户名是否已存在
    if (username && username !== user.username) {
      db.get('SELECT * FROM users WHERE username = ? AND walletAddress != ?', [username, walletAddress], (err, existingUser) => {
        if (err) {
          return res.status(500).json({ 
            status: 'error',
            message: err.message 
          });
        }
        if (existingUser) {
          return res.status(400).json({ 
            status: 'error',
            message: '该用户名已存在' 
          });
        }
        
        // 用户名可用，更新用户信息
        const updateSql = `UPDATE users SET username = ?, avatar = ?, updatedAt = ?, lastProfileUpdateAt = ? WHERE walletAddress = ?`;
        
        db.run(updateSql, [username, avatar || user.avatar, updatedAt, updatedAt, walletAddress], function(err) {
          if (err) {
            return res.status(500).json({ 
              status: 'error',
              message: err.message 
            });
          }
          res.status(200).json({ 
            status: 'success',
            message: '用户信息更新成功', 
            data: { 
              walletAddress, 
              username, 
              avatar: avatar || user.avatar 
            }
          });
        });
      });
    } else {
      // 只更新头像
      const updateSql = `UPDATE users SET avatar = ?, updatedAt = ?, lastProfileUpdateAt = ? WHERE walletAddress = ?`;
      
      db.run(updateSql, [avatar || user.avatar, updatedAt, updatedAt, walletAddress], function(err) {
        if (err) {
          return res.status(500).json({ 
            status: 'error',
            message: err.message 
          });
        }
        res.status(200).json({ 
          status: 'success',
          message: '用户信息更新成功', 
          data: { 
            walletAddress, 
            username: user.username, 
            avatar: avatar || user.avatar 
          }
        });
      });
    }
  });
});

// 获取用户列表（分页）
app.get('/api/users', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // 获取用户列表
  const sql = `SELECT * FROM users ORDER BY registeredAt DESC LIMIT ? OFFSET ?`;
  
  db.all(sql, [Number(limit), Number(skip)], (err, users) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error',
        message: err.message 
      });
    }
    
    // 获取总用户数
    const countSql = `SELECT COUNT(*) as total FROM users`;
    
    db.get(countSql, [], (err, countResult) => {
      if (err) {
        return res.status(500).json({ 
          status: 'error',
          message: err.message 
        });
      }
      
      res.status(200).json({ 
        status: 'success',
        message: '获取用户列表成功', 
        data: { 
          users, 
          pagination: { 
            total: countResult.total, 
            page: Number(page), 
            limit: Number(limit), 
            pages: Math.ceil(countResult.total / limit) 
          }
        }
      });
    });
  });
});

// 删除用户
app.delete('/api/users/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;

  const sql = `DELETE FROM users WHERE walletAddress = ?`;

  db.run(sql, [walletAddress], function(err) {
    if (err) {
      return res.status(500).json({ 
        status: 'error',
        message: err.message 
      });
    }
    if (this.changes === 0) {
      return res.status(404).json({ 
        status: 'error',
        message: '用户不存在' 
      });
    }
    res.status(200).json({ 
      status: 'success',
      message: '删除用户成功' 
    });
  });
});

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SCIA Dapp Backend is running',
    timestamp: new Date().toISOString()
  });
});

// 404路由
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
});

// 优雅关闭数据库连接
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
