-- Migration: Add Profile Fields
-- Date: 2025-11-08
-- Description: Add personal profile fields to users table and create posts table

-- Add profile fields to users table
ALTER TABLE `users` 
  ADD COLUMN `coverImage` TEXT NULL COMMENT '个人主页封面图' AFTER `bio`,
  ADD COLUMN `motto` VARCHAR(200) NULL COMMENT '个人座右铭' AFTER `coverImage`,
  ADD COLUMN `introduction` TEXT NULL COMMENT '详细个人介绍' AFTER `motto`,
  ADD COLUMN `website` VARCHAR(200) NULL COMMENT '个人网站' AFTER `introduction`,
  ADD COLUMN `github` VARCHAR(200) NULL COMMENT 'GitHub' AFTER `website`,
  ADD COLUMN `bilibili` VARCHAR(200) NULL COMMENT 'B站主页' AFTER `github`,
  ADD COLUMN `wechat` VARCHAR(100) NULL COMMENT '微信号' AFTER `bilibili`,
  ADD COLUMN `school` VARCHAR(100) NULL COMMENT '学校' AFTER `wechat`,
  ADD COLUMN `major` VARCHAR(100) NULL COMMENT '专业' AFTER `school`,
  ADD COLUMN `grade` VARCHAR(20) NULL COMMENT '年级' AFTER `major`,
  ADD COLUMN `verified` BOOLEAN NOT NULL DEFAULT false COMMENT '是否认证' AFTER `grade`,
  ADD COLUMN `achievements` TEXT NULL COMMENT '成就列表 (JSON)' AFTER `interests`,
  ADD COLUMN `projectsData` TEXT NULL COMMENT '个人项目列表 (JSON)' AFTER `achievements`;

-- Create posts table if not exists
CREATE TABLE IF NOT EXISTS `posts` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(20) NOT NULL COMMENT 'want_hear, can_tell, share, activity, project',
    `title` VARCHAR(200) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `summary` TEXT NULL,
    `cover` TEXT NULL,
    `category` VARCHAR(50) NOT NULL,
    `tags` TEXT NULL,
    
    -- "我想听"/"我来讲" 特有字段
    `topic` VARCHAR(200) NULL,
    `duration` VARCHAR(50) NULL,
    `audience` TEXT NULL,
    `skillsNeeded` TEXT NULL,
    `threshold` INTEGER NULL,
    `wantHearCount` INTEGER NOT NULL DEFAULT 0,
    `canTellCount` INTEGER NOT NULL DEFAULT 0,
    `scheduledAt` DATETIME(3) NULL,
    
    -- "分享" 特有字段
    `linkType` VARCHAR(20) NULL,
    `linkUrl` TEXT NULL,
    `linkTitle` VARCHAR(200) NULL,
    `linkDesc` TEXT NULL,
    `linkImage` TEXT NULL,
    `linkAuthor` VARCHAR(100) NULL,
    `linkSource` VARCHAR(100) NULL,
    
    -- "活动" 特有字段
    `location` VARCHAR(200) NULL,
    `startTime` DATETIME(3) NULL,
    `endTime` DATETIME(3) NULL,
    `maxParticipants` INTEGER NULL,
    `registrationDeadline` DATETIME(3) NULL,
    `participantsCount` INTEGER NOT NULL DEFAULT 0,
    
    -- "项目" 特有字段
    `projectStage` VARCHAR(50) NULL,
    `teamSize` INTEGER NULL,
    `lookingFor` TEXT NULL,
    `github` VARCHAR(200) NULL,
    `website` VARCHAR(200) NULL,
    `demo` VARCHAR(200) NULL,
    
    -- 媒体文件
    `images` TEXT NULL,
    `videos` TEXT NULL,
    `documents` TEXT NULL,
    
    -- 统计数据
    `viewsCount` INTEGER NOT NULL DEFAULT 0,
    `likesCount` INTEGER NOT NULL DEFAULT 0,
    `commentsCount` INTEGER NOT NULL DEFAULT 0,
    `bookmarksCount` INTEGER NOT NULL DEFAULT 0,
    `sharesCount` INTEGER NOT NULL DEFAULT 0,
    `hotScore` DOUBLE NOT NULL DEFAULT 0,
    `trendingScore` DOUBLE NOT NULL DEFAULT 0,
    
    -- 可见性和状态
    `visibility` VARCHAR(20) NOT NULL DEFAULT 'public',
    `status` VARCHAR(20) NOT NULL DEFAULT 'published',
    
    -- 时间戳
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    
    -- 作者
    `authorId` VARCHAR(191) NOT NULL,
    
    PRIMARY KEY (`id`),
    INDEX `posts_type_createdAt_idx`(`type`, `createdAt` DESC),
    INDEX `posts_type_hotScore_idx`(`type`, `hotScore` DESC),
    INDEX `posts_authorId_createdAt_idx`(`authorId`, `createdAt` DESC),
    INDEX `posts_category_createdAt_idx`(`category`, `createdAt` DESC),
    INDEX `posts_status_publishedAt_idx`(`status`, `publishedAt` DESC),
    INDEX `posts_hotScore_createdAt_idx`(`hotScore` DESC, `createdAt` DESC),
    
    CONSTRAINT `posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

