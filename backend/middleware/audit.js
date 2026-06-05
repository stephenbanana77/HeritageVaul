const db = require('../config/db');

/**
 * 记录一条审计日志
 * @param {object} req - Express request（含 req.user）
 * @param {string} action - 动作：CREATE / UPDATE / DELETE / RETURN / CANCEL / RESET_PWD
 * @param {string} targetTable - 目标业务表名，如 artifacts / loans
 * @param {number} targetId - 目标记录 ID
 * @param {string} targetName - 目标记录的可读名称
 * @param {string} [detail] - 补充说明
 */
async function writeAuditLog(req, action, targetTable, targetId, targetName, detail = '') {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '';
    await db.query(
      `INSERT INTO audit_logs (user_id, username, action, target_table, target_id, target_name, detail, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user?.user_id, req.user?.username, action, targetTable, targetId, targetName, detail, ip]
    );
  } catch {
    // 审计日志写失败不影响主业务
  }
}

module.exports = { writeAuditLog };
