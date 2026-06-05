const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  const { name, status } = req.query;
  const wheres = [];
  const params = [];
  if (name)   { wheres.push('name LIKE ?'); params.push(`%${name}%`); }
  if (status) { wheres.push('status = ?');  params.push(status); }
  const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
  const [rows] = await db.query(
    `SELECT h.*, (SELECT COUNT(*) FROM artifacts a WHERE a.current_hall_id = h.hall_id) AS artifact_count
     FROM halls h ${where} ORDER BY h.hall_id`, params
  );
  res.json(rows);
});

router.get('/all', async (req, res) => {
  const [rows] = await db.query("SELECT hall_id, name, status FROM halls WHERE status = '开放' ORDER BY name");
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM halls WHERE hall_id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: '展馆不存在' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { name, location, area, capacity, description, status, manager } = req.body;
  if (!name) return res.status(400).json({ message: '展馆名称不能为空' });
  const [result] = await db.query(
    'INSERT INTO halls (name, location, area, capacity, description, status, manager) VALUES (?,?,?,?,?,?,?)',
    [name, location, area || null, capacity || null, description, status || '开放', manager]
  );
  res.status(201).json({ hall_id: result.insertId, message: '展馆添加成功' });
});

router.put('/:id', async (req, res) => {
  const { name, location, area, capacity, description, status, manager } = req.body;
  await db.query(
    'UPDATE halls SET name=?, location=?, area=?, capacity=?, description=?, status=?, manager=? WHERE hall_id=?',
    [name, location, area || null, capacity || null, description, status, manager, req.params.id]
  );
  res.json({ message: '展馆更新成功' });
});

router.delete('/:id', async (req, res) => {
  const [arts] = await db.query('SELECT artifact_id FROM artifacts WHERE current_hall_id = ?', [req.params.id]);
  if (arts.length) return res.status(400).json({ message: `该展馆有${arts.length}件藏品，请先调整藏品位置` });
  await db.query('DELETE FROM halls WHERE hall_id = ?', [req.params.id]);
  res.json({ message: '展馆删除成功' });
});

module.exports = router;
