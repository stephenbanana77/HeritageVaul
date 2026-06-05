const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// 仪表盘概览数据
router.get('/overview', async (req, res) => {
  const [[{ total_artifacts }]]     = await db.query('SELECT COUNT(*) AS total_artifacts FROM artifacts');
  const [[{ total_exhibitions }]]   = await db.query('SELECT COUNT(*) AS total_exhibitions FROM exhibitions');
  const [[{ active_loans }]]        = await db.query("SELECT COUNT(*) AS active_loans FROM loans WHERE status IN ('借出中','逾期')");
  const [[{ total_donors }]]        = await db.query('SELECT COUNT(*) AS total_donors FROM donors');
  const [[{ total_value }]]         = await db.query('SELECT IFNULL(SUM(appraised_value),0) AS total_value FROM artifacts');
  const [[{ overdue_loans }]]       = await db.query("SELECT COUNT(*) AS overdue_loans FROM loans WHERE status='逾期'");
  const [[{ ongoing_exhibitions }]] = await db.query("SELECT COUNT(*) AS ongoing_exhibitions FROM exhibitions WHERE status='进行中'");
  const [[{ on_display }]]          = await db.query('SELECT COUNT(*) AS on_display FROM artifacts WHERE is_on_display=1');

  res.json({ total_artifacts, total_exhibitions, active_loans, total_donors,
             total_value, overdue_loans, ongoing_exhibitions, on_display });
});

// 藏品分类分布
router.get('/artifacts-by-category', async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.name, COUNT(a.artifact_id) AS value
     FROM categories c
     LEFT JOIN artifacts a ON a.category_id = c.category_id
     WHERE c.parent_id IS NULL
     GROUP BY c.category_id, c.name ORDER BY value DESC`
  );
  res.json(rows);
});

// 藏品保存状态分布
router.get('/artifacts-by-condition', async (req, res) => {
  const [rows] = await db.query(
    'SELECT condition_status AS name, COUNT(*) AS value FROM artifacts GROUP BY condition_status'
  );
  res.json(rows);
});

// 近6个月借展趋势
router.get('/loans-by-month', async (req, res) => {
  const [rows] = await db.query(
    `SELECT DATE_FORMAT(loan_date, '%Y-%m') AS month, COUNT(*) AS count
     FROM loans
     WHERE loan_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY month ORDER BY month`
  );
  res.json(rows);
});

// 展览参观人次排行
router.get('/exhibition-visitors', async (req, res) => {
  const [rows] = await db.query(
    `SELECT name, visitor_count, status FROM exhibitions
     ORDER BY visitor_count DESC LIMIT 10`
  );
  res.json(rows);
});

// 捐赠人捐赠统计
router.get('/donor-stats', async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.name, COUNT(a.artifact_id) AS artifact_count,
       IFNULL(SUM(a.appraised_value), 0) AS total_value
     FROM donors d
     LEFT JOIN artifacts a ON a.donor_id = d.donor_id
     GROUP BY d.donor_id, d.name
     ORDER BY artifact_count DESC LIMIT 10`
  );
  res.json(rows);
});

// 借展机构统计
router.get('/borrower-stats', async (req, res) => {
  const [rows] = await db.query(
    `SELECT borrower_name, COUNT(*) AS loan_count,
       SUM(CASE WHEN status='已归还' THEN 1 ELSE 0 END) AS returned,
       SUM(CASE WHEN status='逾期' THEN 1 ELSE 0 END) AS overdue
     FROM loans GROUP BY borrower_name ORDER BY loan_count DESC LIMIT 10`
  );
  res.json(rows);
});

module.exports = router;
