const router = require('express').Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/', async (req, res) => {
  const { page = 1, pageSize = 20, username, action, target_table, start_date, end_date } = req.query;
  const offset = (page - 1) * pageSize;
  const wheres = [];
  const params = [];

  if (username)     { wheres.push('username LIKE ?');      params.push(`%${username}%`); }
  if (action)       { wheres.push('action = ?');           params.push(action); }
  if (target_table) { wheres.push('target_table = ?');     params.push(target_table); }
  if (start_date)   { wheres.push('created_at >= ?');      params.push(start_date + ' 00:00:00'); }
  if (end_date)     { wheres.push('created_at <= ?');      params.push(end_date + ' 23:59:59'); }

  const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
  const [rows] = await db.query(
    `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(pageSize), offset]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM audit_logs ${where}`, params
  );
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

module.exports = router;
