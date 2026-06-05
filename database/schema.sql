CREATE DATABASE IF NOT EXISTS museum_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE museum_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS help_docs;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS exhibition_artifacts;
DROP TABLE IF EXISTS exhibitions;
DROP TABLE IF EXISTS artifacts;
DROP TABLE IF EXISTS donors;
DROP TABLE IF EXISTS halls;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS sys_users;
SET FOREIGN_KEY_CHECKS = 1;

-- 系统用户表
CREATE TABLE sys_users (
  user_id   INT PRIMARY KEY AUTO_INCREMENT,
  username  VARCHAR(50)  UNIQUE NOT NULL,
  password  VARCHAR(255) NOT NULL,
  role      ENUM('admin','staff','visitor') NOT NULL DEFAULT 'staff',
  real_name VARCHAR(50),
  email     VARCHAR(100),
  phone     VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);

-- 藏品分类表（支持父子层级）
CREATE TABLE categories (
  category_id  INT PRIMARY KEY AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  parent_id    INT DEFAULT NULL,
  description  TEXT,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

-- 捐赠人/来源机构表
CREATE TABLE donors (
  donor_id          INT PRIMARY KEY AUTO_INCREMENT,
  name              VARCHAR(100) NOT NULL,
  type              ENUM('个人','机构','企业') DEFAULT '个人',
  contact_person    VARCHAR(50),
  phone             VARCHAR(20),
  email             VARCHAR(100),
  address           TEXT,
  donation_count    INT DEFAULT 0,
  first_donation_date DATE,
  notes             TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 展馆/展厅表
CREATE TABLE halls (
  hall_id     INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  location    VARCHAR(200),
  area        DECIMAL(10,2) COMMENT '面积(㎡)',
  capacity    INT           COMMENT '最大容纳参观人数',
  description TEXT,
  status      ENUM('开放','关闭','维修中') DEFAULT '开放',
  manager     VARCHAR(50),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 藏品主表
CREATE TABLE artifacts (
  artifact_id        INT PRIMARY KEY AUTO_INCREMENT,
  name               VARCHAR(200) NOT NULL,
  category_id        INT,
  era                VARCHAR(100)  COMMENT '朝代/年代',
  origin             VARCHAR(200)  COMMENT '产地/来源地',
  material           VARCHAR(200)  COMMENT '材质',
  dimensions         VARCHAR(200)  COMMENT '尺寸规格',
  weight             DECIMAL(10,3) COMMENT '重量(kg)',
  condition_status   ENUM('完好','良好','一般','破损','修复中') DEFAULT '完好',
  acquisition_date   DATE,
  acquisition_method ENUM('捐赠','购买','发掘','借展','其他') DEFAULT '捐赠',
  donor_id           INT,
  current_hall_id    INT,
  storage_location   VARCHAR(200),
  appraised_value    DECIMAL(15,2) COMMENT '估值(元)',
  description        TEXT,
  image_url          VARCHAR(500),
  is_on_display      TINYINT(1) DEFAULT 0,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id)     REFERENCES categories(category_id) ON DELETE SET NULL,
  FOREIGN KEY (donor_id)        REFERENCES donors(donor_id)        ON DELETE SET NULL,
  FOREIGN KEY (current_hall_id) REFERENCES halls(hall_id)          ON DELETE SET NULL
);

-- 展览表
CREATE TABLE exhibitions (
  exhibition_id INT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(200) NOT NULL,
  theme         VARCHAR(200),
  hall_id       INT,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  description   TEXT,
  status        ENUM('筹备中','进行中','已结束','已取消') DEFAULT '筹备中',
  curator       VARCHAR(100),
  visitor_count INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hall_id) REFERENCES halls(hall_id) ON DELETE SET NULL
);

-- 展览-藏品关联表
CREATE TABLE exhibition_artifacts (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  exhibition_id INT NOT NULL,
  artifact_id   INT NOT NULL,
  display_order INT DEFAULT 0,
  notes         TEXT,
  FOREIGN KEY (exhibition_id) REFERENCES exhibitions(exhibition_id) ON DELETE CASCADE,
  FOREIGN KEY (artifact_id)   REFERENCES artifacts(artifact_id)     ON DELETE CASCADE,
  UNIQUE KEY uk_ea (exhibition_id, artifact_id)
);

-- 借展记录表
CREATE TABLE loans (
  loan_id              INT PRIMARY KEY AUTO_INCREMENT,
  artifact_id          INT NOT NULL,
  borrower_name        VARCHAR(200) NOT NULL,
  borrower_contact     VARCHAR(100),
  borrower_phone       VARCHAR(20),
  purpose              TEXT,
  loan_date            DATE NOT NULL,
  expected_return_date DATE NOT NULL,
  actual_return_date   DATE,
  status               ENUM('借出中','已归还','逾期','取消') DEFAULT '借出中',
  condition_before     TEXT,
  condition_after      TEXT,
  approved_by          INT,
  notes                TEXT,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artifact_id)  REFERENCES artifacts(artifact_id),
  FOREIGN KEY (approved_by)  REFERENCES sys_users(user_id) ON DELETE SET NULL
);

-- 在线帮助文档表（模块名为主键）
CREATE TABLE help_docs (
  module_name VARCHAR(100) PRIMARY KEY COMMENT '对应前端页面路径名',
  title       VARCHAR(200) NOT NULL,
  content     TEXT         NOT NULL,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
