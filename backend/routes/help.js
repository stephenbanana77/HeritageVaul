const router = require('express').Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

// 按模块名获取帮助（所有人可用）
router.get('/:module', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM help_docs WHERE module_name = ?', [req.params.module]);
  if (!rows.length) return res.status(404).json({ message: '暂无此页面的帮助文档' });
  res.json(rows[0]);
});

// 获取所有帮助文档列表（管理维护用）
router.get('/', requireAdmin, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM help_docs ORDER BY module_name');
  res.json(rows);
});

// 新增或更新帮助文档（UPSERT）
router.post('/', requireAdmin, async (req, res) => {
  const { module_name, title, content } = req.body;
  if (!module_name || !title || !content) return res.status(400).json({ message: '字段不完整' });
  await db.query(
    'INSERT INTO help_docs (module_name, title, content) VALUES (?,?,?) ON DUPLICATE KEY UPDATE title=?, content=?',
    [module_name, title, content, title, content]
  );
  res.json({ message: '帮助文档保存成功' });
});

router.delete('/:module', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM help_docs WHERE module_name = ?', [req.params.module]);
  res.json({ message: '帮助文档删除成功' });
});

module.exports = router;
