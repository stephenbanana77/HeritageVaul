const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// 获取所有分类（树形结构）
router.get('/', async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.*, p.name AS parent_name,
       (SELECT COUNT(*) FROM artifacts a WHERE a.category_id = c.category_id) AS artifact_count
     FROM categories c LEFT JOIN categories p ON c.parent_id = p.category_id
     ORDER BY IFNULL(c.parent_id, c.category_id), c.sort_order`
  );
  // 构建树形结构
  const map = {};
  const tree = [];
  rows.forEach(r => { map[r.category_id] = { ...r, children: [] }; });
  rows.forEach(r => {
    if (r.parent_id && map[r.parent_id]) {
      map[r.parent_id].children.push(map[r.category_id]);
    } else if (!r.parent_id) {
      tree.push(map[r.category_id]);
    }
  });
  res.json(tree);
});

// 扁平列表（供下拉选择）
router.get('/flat', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY IFNULL(parent_id,category_id), sort_order');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name, parent_id, description, sort_order } = req.body;
  if (!name) return res.status(400).json({ message: '分类名称不能为空' });
  const [result] = await db.query(
    'INSERT INTO categories (name, parent_id, description, sort_order) VALUES (?,?,?,?)',
    [name, parent_id || null, description, sort_order || 0]
  );
  res.status(201).json({ category_id: result.insertId, message: '分类创建成功' });
});

router.put('/:id', async (req, res) => {
  const { name, parent_id, description, sort_order } = req.body;
  await db.query(
    'UPDATE categories SET name=?, parent_id=?, description=?, sort_order=? WHERE category_id=?',
    [name, parent_id || null, description, sort_order || 0, req.params.id]
  );
  res.json({ message: '分类更新成功' });
});

router.delete('/:id', async (req, res) => {
  const [arts] = await db.query('SELECT artifact_id FROM artifacts WHERE category_id = ?', [req.params.id]);
  if (arts.length) return res.status(400).json({ message: `该分类下有${arts.length}件藏品，请先更改藏品分类` });
  const [children] = await db.query('SELECT category_id FROM categories WHERE parent_id = ?', [req.params.id]);
  if (children.length) return res.status(400).json({ message: '请先删除子分类' });
  await db.query('DELETE FROM categories WHERE category_id = ?', [req.params.id]);
  res.json({ message: '分类删除成功' });
});

module.exports = router;
