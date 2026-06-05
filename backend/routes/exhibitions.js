const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, name, status } = req.query;
  const offset = (page - 1) * pageSize;
  const wheres = [];
  const params = [];
  if (name)   { wheres.push('e.name LIKE ?'); params.push(`%${name}%`); }
  if (status) { wheres.push('e.status = ?');  params.push(status); }
  const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
  const [rows] = await db.query(
    `SELECT e.*, h.name AS hall_name,
       (SELECT COUNT(*) FROM exhibition_artifacts ea WHERE ea.exhibition_id = e.exhibition_id) AS artifact_count
     FROM exhibitions e LEFT JOIN halls h ON e.hall_id = h.hall_id
     ${where} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(pageSize), offset]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM exhibitions e ${where}`, params
  );
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', async (req, res) => {
  const [rows] = await db.query(
    `SELECT e.*, h.name AS hall_name FROM exhibitions e
     LEFT JOIN halls h ON e.hall_id = h.hall_id WHERE e.exhibition_id = ?`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: '展览不存在' });
  const [artifacts] = await db.query(
    `SELECT a.artifact_id, a.name, a.era, a.category_id, c.name AS category_name, ea.display_order, ea.notes
     FROM exhibition_artifacts ea
     JOIN artifacts a ON ea.artifact_id = a.artifact_id
     LEFT JOIN categories c ON a.category_id = c.category_id
     WHERE ea.exhibition_id = ? ORDER BY ea.display_order`, [req.params.id]
  );
  res.json({ ...rows[0], artifacts });
});

router.post('/', async (req, res) => {
  const { name, theme, hall_id, start_date, end_date, description, status, curator } = req.body;
  if (!name || !start_date || !end_date) return res.status(400).json({ message: '展览名称和时间不能为空' });
  const [result] = await db.query(
    'INSERT INTO exhibitions (name, theme, hall_id, start_date, end_date, description, status, curator) VALUES (?,?,?,?,?,?,?,?)',
    [name, theme, hall_id || null, start_date, end_date, description, status || '筹备中', curator]
  );
  res.status(201).json({ exhibition_id: result.insertId, message: '展览创建成功' });
});

router.put('/:id', async (req, res) => {
  const { name, theme, hall_id, start_date, end_date, description, status, curator, visitor_count } = req.body;
  await db.query(
    'UPDATE exhibitions SET name=?, theme=?, hall_id=?, start_date=?, end_date=?, description=?, status=?, curator=?, visitor_count=? WHERE exhibition_id=?',
    [name, theme, hall_id || null, start_date, end_date, description, status, curator, visitor_count || 0, req.params.id]
  );
  res.json({ message: '展览更新成功' });
});

router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM exhibitions WHERE exhibition_id = ?', [req.params.id]);
  res.json({ message: '展览删除成功' });
});

// 展览添加藏品
router.post('/:id/artifacts', async (req, res) => {
  const { artifact_ids } = req.body;
  if (!artifact_ids?.length) return res.status(400).json({ message: '请选择藏品' });
  const values = artifact_ids.map((aid, i) => [req.params.id, aid, i + 1]);
  await db.query(
    'INSERT IGNORE INTO exhibition_artifacts (exhibition_id, artifact_id, display_order) VALUES ?', [values]
  );
  res.json({ message: '藏品已加入展览' });
});

// 展览移除藏品
router.delete('/:id/artifacts/:aid', async (req, res) => {
  await db.query(
    'DELETE FROM exhibition_artifacts WHERE exhibition_id = ? AND artifact_id = ?',
    [req.params.id, req.params.aid]
  );
  res.json({ message: '藏品已从展览移除' });
});

module.exports = router;
