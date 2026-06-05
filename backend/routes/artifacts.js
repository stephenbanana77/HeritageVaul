const router = require('express').Router();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { writeAuditLog } = require('../middleware/audit');

function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  const filePath = path.join(__dirname, '..', imageUrl);
  fs.unlink(filePath, () => {});
}

router.use(authenticate);

// 列表（分页 + 多条件查询）
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, name, category_id, era, condition_status, is_on_display } = req.query;
  const offset = (page - 1) * pageSize;
  const wheres = [];
  const params = [];

  if (name)             { wheres.push('a.name LIKE ?');             params.push(`%${name}%`); }
  if (category_id)      { wheres.push('a.category_id = ?');         params.push(category_id); }
  if (era)              { wheres.push('a.era LIKE ?');               params.push(`%${era}%`); }
  if (condition_status) { wheres.push('a.condition_status = ?');     params.push(condition_status); }
  if (is_on_display !== undefined && is_on_display !== '') {
    wheres.push('a.is_on_display = ?'); params.push(Number(is_on_display));
  }

  const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
  const sql = `
    SELECT a.*, c.name AS category_name, d.name AS donor_name, h.name AS hall_name
    FROM artifacts a
    LEFT JOIN categories c ON a.category_id = c.category_id
    LEFT JOIN donors d ON a.donor_id = d.donor_id
    LEFT JOIN halls h ON a.current_hall_id = h.hall_id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?`;
  const [rows] = await db.query(sql, [...params, Number(pageSize), offset]);
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM artifacts a ${where}`, params
  );
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

// 详情
router.get('/:id', async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.*, c.name AS category_name, d.name AS donor_name, h.name AS hall_name
     FROM artifacts a
     LEFT JOIN categories c ON a.category_id = c.category_id
     LEFT JOIN donors d ON a.donor_id = d.donor_id
     LEFT JOIN halls h ON a.current_hall_id = h.hall_id
     WHERE a.artifact_id = ?`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: '藏品不存在' });
  res.json(rows[0]);
});

// 新增
router.post('/', async (req, res) => {
  const fields = ['name','category_id','era','origin','material','dimensions','weight',
    'condition_status','acquisition_date','acquisition_method','donor_id','current_hall_id',
    'storage_location','appraised_value','description','story','image_url','is_on_display'];
  const values = fields.map(f => req.body[f] ?? null);
  const [result] = await db.query(
    `INSERT INTO artifacts (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
    values
  );
  await writeAuditLog(req, 'CREATE', 'artifacts', result.insertId, req.body.name);
  res.status(201).json({ artifact_id: result.insertId, message: '藏品添加成功' });
});

// 修改
router.put('/:id', async (req, res) => {
  const [[old]] = await db.query('SELECT image_url FROM artifacts WHERE artifact_id = ?', [req.params.id]);
  const fields = ['name','category_id','era','origin','material','dimensions','weight',
    'condition_status','acquisition_date','acquisition_method','donor_id','current_hall_id',
    'storage_location','appraised_value','description','story','image_url','is_on_display'];
  const sets = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => req.body[f] ?? null);
  await db.query(`UPDATE artifacts SET ${sets} WHERE artifact_id = ?`, [...values, req.params.id]);
  if (old?.image_url && old.image_url !== (req.body.image_url ?? null)) {
    deleteImageFile(old.image_url);
  }
  await writeAuditLog(req, 'UPDATE', 'artifacts', req.params.id, req.body.name);
  res.json({ message: '藏品更新成功' });
});

// 删除（检查是否有未归还借展记录）
router.delete('/:id', async (req, res) => {
  const [loans] = await db.query(
    "SELECT loan_id FROM loans WHERE artifact_id = ? AND status IN ('借出中','逾期')", [req.params.id]
  );
  if (loans.length) return res.status(400).json({ message: '该藏品有未归还的借展记录，不能删除' });
  const [[artifact]] = await db.query('SELECT name, image_url FROM artifacts WHERE artifact_id = ?', [req.params.id]);
  await db.query('DELETE FROM artifacts WHERE artifact_id = ?', [req.params.id]);
  deleteImageFile(artifact?.image_url);
  await writeAuditLog(req, 'DELETE', 'artifacts', req.params.id, artifact?.name || '');
  res.json({ message: '藏品删除成功' });
});

module.exports = router;
