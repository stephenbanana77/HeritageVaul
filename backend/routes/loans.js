const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { writeAuditLog } = require('../middleware/audit');

router.use(authenticate);

router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, status, borrower_name, artifact_name } = req.query;
  const offset = (page - 1) * pageSize;
  const wheres = [];
  const params = [];
  if (status)        { wheres.push('l.status = ?');                params.push(status); }
  if (borrower_name) { wheres.push('l.borrower_name LIKE ?');      params.push(`%${borrower_name}%`); }
  if (artifact_name) { wheres.push('a.name LIKE ?');               params.push(`%${artifact_name}%`); }
  const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
  const [rows] = await db.query(
    `SELECT l.*, a.name AS artifact_name, u.real_name AS approver_name
     FROM loans l
     JOIN artifacts a ON l.artifact_id = a.artifact_id
     LEFT JOIN sys_users u ON l.approved_by = u.user_id
     ${where} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(pageSize), offset]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM loans l JOIN artifacts a ON l.artifact_id = a.artifact_id ${where}`, params
  );

  // 自动标记逾期
  await db.query(
    "UPDATE loans SET status='逾期' WHERE status='借出中' AND expected_return_date < CURDATE()"
  );

  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', async (req, res) => {
  const [rows] = await db.query(
    `SELECT l.*, a.name AS artifact_name, a.condition_status, u.real_name AS approver_name
     FROM loans l
     JOIN artifacts a ON l.artifact_id = a.artifact_id
     LEFT JOIN sys_users u ON l.approved_by = u.user_id
     WHERE l.loan_id = ?`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: '借展记录不存在' });
  res.json(rows[0]);
});

// 新增借展
router.post('/', async (req, res) => {
  const { artifact_id, borrower_name, borrower_contact, borrower_phone, purpose,
          loan_date, expected_return_date, condition_before, notes } = req.body;
  if (!artifact_id || !borrower_name || !loan_date || !expected_return_date) {
    return res.status(400).json({ message: '藏品、借展机构和时间不能为空' });
  }
  const [active] = await db.query(
    "SELECT loan_id FROM loans WHERE artifact_id = ? AND status IN ('借出中','逾期')", [artifact_id]
  );
  if (active.length) return res.status(400).json({ message: '该藏品当前已处于借出状态' });

  const [[artifact]] = await db.query('SELECT name FROM artifacts WHERE artifact_id = ?', [artifact_id]);
  const [result] = await db.query(
    `INSERT INTO loans (artifact_id, borrower_name, borrower_contact, borrower_phone, purpose,
      loan_date, expected_return_date, condition_before, notes, approved_by, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [artifact_id, borrower_name, borrower_contact, borrower_phone, purpose,
     loan_date, expected_return_date, condition_before, notes, req.user.user_id, '借出中']
  );
  await writeAuditLog(req, 'CREATE', 'loans', result.insertId,
    artifact?.name || '', `借展给：${borrower_name}`);
  res.status(201).json({ loan_id: result.insertId, message: '借展记录创建成功' });
});

// 办理归还
router.put('/:id/return', async (req, res) => {
  const { actual_return_date, condition_after, notes } = req.body;
  if (!actual_return_date) return res.status(400).json({ message: '实际归还日期不能为空' });
  const [[loan]] = await db.query(
    `SELECT l.borrower_name, a.name AS artifact_name FROM loans l
     JOIN artifacts a ON l.artifact_id = a.artifact_id WHERE l.loan_id = ?`, [req.params.id]
  );
  await db.query(
    "UPDATE loans SET status='已归还', actual_return_date=?, condition_after=?, notes=CONCAT(IFNULL(notes,''),' ',IFNULL(?,'')) WHERE loan_id=?",
    [actual_return_date, condition_after, notes || '', req.params.id]
  );
  await writeAuditLog(req, 'RETURN', 'loans', req.params.id,
    loan?.artifact_name || '', `归还自：${loan?.borrower_name || ''}`);
  res.json({ message: '归还办理成功' });
});

// 取消借展
router.put('/:id/cancel', async (req, res) => {
  const [[loan]] = await db.query(
    `SELECT l.borrower_name, a.name AS artifact_name FROM loans l
     JOIN artifacts a ON l.artifact_id = a.artifact_id WHERE l.loan_id = ?`, [req.params.id]
  );
  await db.query("UPDATE loans SET status='取消' WHERE loan_id=?", [req.params.id]);
  await writeAuditLog(req, 'CANCEL', 'loans', req.params.id, loan?.artifact_name || '');
  res.json({ message: '借展已取消' });
});

module.exports = router;
