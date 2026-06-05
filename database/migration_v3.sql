-- 迁移脚本 v3：藏品新增文化故事字段
USE museum_db;

ALTER TABLE artifacts
  ADD COLUMN story MEDIUMTEXT COMMENT '文化故事（富文本HTML）' AFTER description;
