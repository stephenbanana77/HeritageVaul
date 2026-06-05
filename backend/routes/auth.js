const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' });

  const [rows] = await db.query('SELECT * FROM sys_users WHERE username = ?', [username]);
  if (!rows.length) return res.status(401).json({ message: '用户名或密码错误' });

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: '用户名或密码错误' });

  await db.query('UPDATE sys_users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

  const token = jwt.sign(
    { user_id: user.user_id, username: user.username, role: user.role, real_name: user.real_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  res.json({ token, user: { user_id: user.user_id, username: user.username, role: user.role, real_name: user.real_name } });
});

// 注册（管理员操作，同 users 路由，此处保留）
router.post('/register', async (req, res) => {
  const { username, password, role, real_name, email, phone } = req.body;
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' });

  const [exist] = await db.query('SELECT user_id FROM sys_users WHERE username = ?', [username]);
  if (exist.length) return res.status(409).json({ message: '用户名已存在' });

  const hash = await bcrypt.hash(password, 10);
  await db.query(
    'INSERT INTO sys_users (username, password, role, real_name, email, phone) VALUES (?,?,?,?,?,?)',
    [username, hash, role || 'staff', real_name || '', email || '', phone || '']
  );
  res.status(201).json({ message: '注册成功' });
});

// 获取当前用户信息
router.get('/me', authenticate, async (req, res) => {
  const [rows] = await db.query(
    'SELECT user_id, username, role, real_name, email, phone, created_at, last_login FROM sys_users WHERE user_id = ?',
    [req.user.user_id]
  );
  if (!rows.length) return res.status(404).json({ message: '用户不存在' });
  res.json(rows[0]);
});

module.exports = router;
