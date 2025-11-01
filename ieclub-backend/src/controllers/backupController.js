const backupService = require('../services/backupService');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 创建完整备份
 */
exports.createBackup = async (req, res, next) => {
  try {
    logger.info('创建备份请求', { userId: req.user.id });

    const result = await backupService.createFullBackup();

    logger.info('备份创建成功', { 
      backup: result.name,
      userId: req.user.id 
    });

    res.json(response.success(result, '备份创建成功'));
  } catch (error) {
    next(error);
  }
};

/**
 * 列出所有备份
 */
exports.listBackups = async (req, res, next) => {
  try {
    const backups = await backupService.listBackups();

    res.json(response.success({
      backups,
      total: backups.length
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * 恢复备份
 */
exports.restoreBackup = async (req, res, next) => {
  try {
    const { backupName } = req.body;

    if (!backupName) {
      return res.status(400).json(response.error('请提供备份名称'));
    }

    logger.info('恢复备份请求', { 
      backup: backupName,
      userId: req.user.id 
    });

    const result = await backupService.restoreFullBackup(backupName);

    logger.info('备份恢复成功', { 
      backup: backupName,
      userId: req.user.id 
    });

    res.json(response.success(result, '备份恢复成功'));
  } catch (error) {
    next(error);
  }
};

/**
 * 删除备份
 */
exports.deleteBackup = async (req, res, next) => {
  try {
    const { backupName } = req.params;

    logger.info('删除备份请求', { 
      backup: backupName,
      userId: req.user.id 
    });

    await backupService.deleteBackup(backupName);

    logger.info('备份删除成功', { 
      backup: backupName,
      userId: req.user.id 
    });

    res.json(response.success(null, '备份删除成功'));
  } catch (error) {
    next(error);
  }
};

/**
 * 备份特定表
 */
exports.backupTable = async (req, res, next) => {
  try {
    const { tableName } = req.body;

    if (!tableName) {
      return res.status(400).json(response.error('请提供表名'));
    }

    logger.info('备份表请求', { 
      table: tableName,
      userId: req.user.id 
    });

    const result = await backupService.exportTable(tableName);

    res.json(response.success(result, '表备份成功'));
  } catch (error) {
    next(error);
  }
};

/**
 * 恢复特定表
 */
exports.restoreTable = async (req, res, next) => {
  try {
    const { tableName, filePath } = req.body;

    if (!tableName || !filePath) {
      return res.status(400).json(response.error('请提供表名和文件路径'));
    }

    logger.info('恢复表请求', { 
      table: tableName,
      file: filePath,
      userId: req.user.id 
    });

    const count = await backupService.importTable(tableName, filePath);

    res.json(response.success({ records: count }, '表恢复成功'));
  } catch (error) {
    next(error);
  }
};

/**
 * 备份数据库
 */
exports.backupDatabase = async (req, res, next) => {
  try {
    logger.info('备份数据库请求', { userId: req.user.id });

    const file = await backupService.backupDatabase();

    res.json(response.success({ file }, '数据库备份成功'));
  } catch (error) {
    next(error);
  }
};

/**
 * 备份Redis
 */
exports.backupRedis = async (req, res, next) => {
  try {
    logger.info('备份Redis请求', { userId: req.user.id });

    const file = await backupService.backupRedis();

    res.json(response.success({ file }, 'Redis备份成功'));
  } catch (error) {
    next(error);
  }
};

/**
 * 备份上传文件
 */
exports.backupUploads = async (req, res, next) => {
  try {
    logger.info('备份上传文件请求', { userId: req.user.id });

    const file = await backupService.backupUploads();

    if (!file) {
      return res.json(response.success(null, '上传目录为空，跳过备份'));
    }

    res.json(response.success({ file }, '上传文件备份成功'));
  } catch (error) {
    next(error);
  }
};

