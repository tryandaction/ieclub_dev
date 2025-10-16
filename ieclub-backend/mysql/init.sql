-- IEClub数据库初始化脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS ieclub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE ieclub;

-- 设置时区
SET time_zone = '+08:00';

-- 创建用户（如果不存在）
CREATE USER IF NOT EXISTS 'ieclub_user'@'%' IDENTIFIED BY 'kE7pCg$r@W9nZ!sV2';

-- 授权用户
GRANT ALL PRIVILEGES ON ieclub.* TO 'ieclub_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 插入一些测试数据（可选）
-- INSERT INTO users (nickname, avatar, openid) VALUES
-- ('测试用户', 'https://example.com/avatar.jpg', 'test_openid_001');