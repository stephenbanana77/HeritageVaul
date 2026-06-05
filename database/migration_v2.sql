-- 迁移脚本 v2：新增审计日志表
-- 在已有数据库上执行此文件，不会影响现有数据
USE museum_db;

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id       INT PRIMARY KEY AUTO_INCREMENT,
  user_id      INT,
  username     VARCHAR(50),
  action       VARCHAR(30) NOT NULL COMMENT 'CREATE/UPDATE/DELETE/RETURN/CANCEL/RESET_PWD',
  target_table VARCHAR(50) COMMENT '操作的业务表',
  target_id    INT         COMMENT '操作记录的ID',
  target_name  VARCHAR(200) COMMENT '操作记录的可读名称',
  detail       TEXT        COMMENT '补充说明',
  ip_address   VARCHAR(50),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user    (user_id),
  INDEX idx_action  (action),
  INDEX idx_table   (target_table),
  INDEX idx_created (created_at)
);
