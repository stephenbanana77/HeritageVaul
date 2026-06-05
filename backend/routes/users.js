const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { writeAuditLog } = require('../middleware/audit');

router.use(authenticate, requireAdmin);

router.get('/', async (req, res) => {
  const [rows] = await db.query(
    'SELECT user_id, username, role, real_name, email, phone, created_at, last_login FROM sys_users ORDER BY created_at DESC'
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { username, password, role, real_name, email, phone } = req.body;
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' });
  const [exist] = await db.query('SELECT user_id FROM sys_users WHERE username = ?', [username]);
  if (exist.length) return res.status(409).json({ message: '用户名已存在' });
  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO sys_users (username, password, role, real_name, email, phone) VALUES (?,?,?,?,?,?)',
    [username, hash, role || 'staff', real_name || '', email || '', phone || '']
  );
  await writeAuditLog(req, 'CREATE', 'sys_users', result.insertId, username);
  res.status(201).json({ user_id: result.insertId, message: '用户创建成功' });
});

router.put('/:id', async (req, res) => {
  const { role, real_name, email, phone } = req.body;
  await db.query(
    'UPDATE sys_users SET role=?, real_name=?, email=?, phone=? WHERE user_id=?',
    [role, real_name, email, phone, req.params.id]
  );
  await writeAuditLog(req, 'UPDATE', 'sys_users', req.params.id, real_name || '');
  res.json({ message: '用户信息更新成功' });
});

// 重置密码
router.put('/:id/password', async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) return res.status(400).json({ message: '密码至少6位' });
  const hash = await bcrypt.hash(new_password, 10);
  await db.query('UPDATE sys_users SET password=? WHERE user_id=?', [hash, req.params.id]);
  await writeAuditLog(req, 'RESET_PWD', 'sys_users', req.params.id, '');
  res.json({ message: '密码重置成功' });
});

router.delete('/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.user_id) {
    return res.status(400).json({ message: '不能删除当前登录账户' });
  }
  const [[user]] = await db.query('SELECT username FROM sys_users WHERE user_id = ?', [req.params.id]);
  await db.query('DELETE FROM sys_users WHERE user_id = ?', [req.params.id]);
  await writeAuditLog(req, 'DELETE', 'sys_users', req.params.id, user?.username || '');
  res.json({ message: '用户删除成功' });
});

module.exports = router;
