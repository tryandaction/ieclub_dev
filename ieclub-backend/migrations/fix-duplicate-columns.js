// migrations/fix-duplicate-columns.js
// 修复数据库列重复问题的脚本

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDuplicateColumns() {
  console.log('开始修复数据库列重复问题...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ieclub'
  });

  try {
    // 检查并添加 school 列
    await addColumnIfNotExists(connection, 'users', 'school', 'VARCHAR(100) NULL');
    
    // 检查并添加 major 列
    await addColumnIfNotExists(connection, 'users', 'major', 'VARCHAR(100) NULL');
    
    // 检查并添加 grade 列
    await addColumnIfNotExists(connection, 'users', 'grade', 'VARCHAR(20) NULL');
    
    // 检查并添加 verified 列
    await addColumnIfNotExists(connection, 'users', 'verified', 'BOOLEAN NOT NULL DEFAULT false');

    console.log('✅ 数据库列修复完成！');
  } catch (error) {
    console.error('❌ 修复失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function addColumnIfNotExists(connection, table, column, definition) {
  try {
    // 检查列是否存在
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ? 
       AND COLUMN_NAME = ?`,
      [table, column]
    );

    if (rows.length === 0) {
      // 列不存在，添加它
      await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`✅ 已添加列: ${table}.${column}`);
    } else {
      console.log(`ℹ️  列已存在: ${table}.${column}`);
    }
  } catch (error) {
    console.error(`❌ 处理列 ${table}.${column} 时出错:`, error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixDuplicateColumns()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixDuplicateColumns };

