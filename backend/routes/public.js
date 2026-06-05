const router = require('express').Router();
const db = require('../config/db');

// 公开接口，无需登录

// 藏品列表（仅返回展出中的藏品）
router.get('/artifacts', async (req, res) => {
  const { page = 1, pageSize = 12, keyword, category_id, era } = req.query;
  const offset = (page - 1) * pageSize;
  const wheres = ['a.is_on_display = 1'];
  const params = [];

  if (keyword)    { wheres.push('(a.name LIKE ? OR a.description LIKE ? OR a.story LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (category_id){ wheres.push('a.category_id = ?'); params.push(category_id); }
  if (era)        { wheres.push('a.era LIKE ?');       params.push(`%${era}%`); }

  const where = 'WHERE ' + wheres.join(' AND ');
  const [rows] = await db.query(
    `SELECT a.artifact_id, a.name, a.era, a.origin, a.material, a.image_url,
            a.description, a.story, a.condition_status, a.acquisition_date,
            c.name AS category_name, d.name AS donor_name
     FROM artifacts a
     LEFT JOIN categories c ON a.category_id = c.category_id
     LEFT JOIN donors d ON a.donor_id = d.donor_id
     ${where}
     ORDER BY a.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(pageSize), offset]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM artifacts a ${where}`, params
  );
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

// 藏品详情（公开）
router.get('/artifacts/:id', async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.*, c.name AS category_name, d.name AS donor_name, h.name AS hall_name
     FROM artifacts a
     LEFT JOIN categories c ON a.category_id = c.category_id
     LEFT JOIN donors d ON a.donor_id = d.donor_id
     LEFT JOIN halls h ON a.current_hall_id = h.hall_id
     WHERE a.artifact_id = ? AND a.is_on_display = 1`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: '藏品不存在或未展出' });
  res.json(rows[0]);
});

// 分类列表（公开，用于筛选）
router.get('/categories', async (req, res) => {
  const [rows] = await db.query(
    `SELECT DISTINCT c.category_id, c.name
     FROM categories c
     INNER JOIN artifacts a ON a.category_id = c.category_id AND a.is_on_display = 1
     ORDER BY c.sort_order, c.name`
  );
  res.json(rows);
});

module.exports = router;
