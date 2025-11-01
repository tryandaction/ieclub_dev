const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有备份操作都需要管理员权限

/**
 * @route   POST /api/backup/full
 * @desc    创建完整备份
 * @access  Private (Admin)
 */
router.post('/full', 
  authenticate, 
  authorize(['admin']), 
  backupController.createBackup
);

/**
 * @route   GET /api/backup/list
 * @desc    列出所有备份
 * @access  Private (Admin)
 */
router.get('/list', 
  authenticate, 
  authorize(['admin']), 
  backupController.listBackups
);

/**
 * @route   POST /api/backup/restore
 * @desc    恢复备份
 * @access  Private (Admin)
 */
router.post('/restore', 
  authenticate, 
  authorize(['admin']), 
  backupController.restoreBackup
);

/**
 * @route   DELETE /api/backup/:backupName
 * @desc    删除备份
 * @access  Private (Admin)
 */
router.delete('/:backupName', 
  authenticate, 
  authorize(['admin']), 
  backupController.deleteBackup
);

/**
 * @route   POST /api/backup/table
 * @desc    备份特定表
 * @access  Private (Admin)
 */
router.post('/table', 
  authenticate, 
  authorize(['admin']), 
  backupController.backupTable
);

/**
 * @route   POST /api/backup/table/restore
 * @desc    恢复特定表
 * @access  Private (Admin)
 */
router.post('/table/restore', 
  authenticate, 
  authorize(['admin']), 
  backupController.restoreTable
);

/**
 * @route   POST /api/backup/database
 * @desc    仅备份数据库
 * @access  Private (Admin)
 */
router.post('/database', 
  authenticate, 
  authorize(['admin']), 
  backupController.backupDatabase
);

/**
 * @route   POST /api/backup/redis
 * @desc    仅备份Redis
 * @access  Private (Admin)
 */
router.post('/redis', 
  authenticate, 
  authorize(['admin']), 
  backupController.backupRedis
);

/**
 * @route   POST /api/backup/uploads
 * @desc    仅备份上传文件
 * @access  Private (Admin)
 */
router.post('/uploads', 
  authenticate, 
  authorize(['admin']), 
  backupController.backupUploads
);

module.exports = router;

