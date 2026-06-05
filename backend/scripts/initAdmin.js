require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function init() {
  const hash = await bcrypt.hash('admin123', 10);
  await db.query(
    `INSERT INTO sys_users (username, password, role, real_name, email, phone)
     VALUES ('admin', ?, 'admin', '系统管理员', 'admin@museum.cn', '010-00000000')
     ON DUPLICATE KEY UPDATE password = ?`,
    [hash, hash]
  );

  const staffHash = await bcrypt.hash('staff123', 10);
  const staffList = [
    ['liming', '李明', 'staff', 'liming@museum.cn'],
    ['zhangfang', '张芳', 'staff', 'zhangfang@museum.cn'],
    ['wangwei', '王伟', 'visitor', 'wangwei@museum.cn'],
  ];
  for (const [username, real_name, role, email] of staffList) {
    await db.query(
      `INSERT IGNORE INTO sys_users (username, password, role, real_name, email)
       VALUES (?, ?, ?, ?, ?)`,
      [username, staffHash, role, real_name, email]
    );
  }

  console.log('初始化完成！');
  console.log('管理员账户: admin / admin123');
  console.log('工作人员账户: liming / staff123, zhangfang / staff123');
  console.log('访客账户: wangwei / staff123');
  process.exit(0);
}

init().catch(e => { console.error(e); process.exit(1); });
