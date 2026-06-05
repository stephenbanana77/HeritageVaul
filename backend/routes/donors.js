const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, name, type } = req.query;
  const offset = (page - 1) * pageSize;
  const wheres = [];
  const params = [];
  if (name) { wheres.push('name LIKE ?'); params.push(`%${name}%`); }
  if (type) { wheres.push('type = ?');    params.push(type); }
  const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
  const [rows] = await db.query(
    `SELECT * FROM donors ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(pageSize), offset]
  );
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM donors ${where}`, params);
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/all', async (req, res) => {
  const [rows] = await db.query('SELECT donor_id, name, type FROM donors ORDER BY name');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM donors WHERE donor_id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: '捐赠人不存在' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { name, type, contact_person, phone, email, address, first_donation_date, notes } = req.body;
  if (!name) return res.status(400).json({ message: '姓名/名称不能为空' });
  const [result] = await db.query(
    'INSERT INTO donors (name, type, contact_person, phone, email, address, first_donation_date, notes) VALUES (?,?,?,?,?,?,?,?)',
    [name, type || '个人', contact_person, phone, email, address, first_donation_date || null, notes]
  );
  res.status(201).json({ donor_id: result.insertId, message: '捐赠人添加成功' });
});

router.put('/:id', async (req, res) => {
  const { name, type, contact_person, phone, email, address, first_donation_date, notes } = req.body;
  await db.query(
    'UPDATE donors SET name=?, type=?, contact_person=?, phone=?, email=?, address=?, first_donation_date=?, notes=? WHERE donor_id=?',
    [name, type, contact_person, phone, email, address, first_donation_date || null, notes, req.params.id]
  );
  res.json({ message: '捐赠人更新成功' });
});

router.delete('/:id', async (req, res) => {
  const [arts] = await db.query('SELECT artifact_id FROM artifacts WHERE donor_id = ?', [req.params.id]);
  if (arts.length) return res.status(400).json({ message: `该捐赠人关联了${arts.length}件藏品，请先解除关联` });
  await db.query('DELETE FROM donors WHERE donor_id = ?', [req.params.id]);
  res.json({ message: '捐赠人删除成功' });
});

module.exports = router;
