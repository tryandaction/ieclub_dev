// 在测试环境设置管理员
require('dotenv').config({path: '.env.staging'});
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 从命令行参数获取管理员邮箱
const adminEmail = process.argv[2] || '请输入管理员邮箱';

if (!process.argv[2]) {
  console.error('');
  console.error('❌ 错误: 请提供管理员邮箱');
  console.error('');
  console.error('用法:');
  console.error('  node set-admin-staging.js <管理员邮箱>');
  console.error('');
  console.error('示例:');
  console.error('  node set-admin-staging.js your.email@mail.sustech.edu.cn');
  console.error('');
  process.exit(1);
}

(async () => {
  try {
    console.log('');
    console.log('='.repeat(50));
    console.log(' 测试环境管理员设置');
    console.log('='.repeat(50));
    console.log('');
    
    // 查找用户
    let user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (user) {
      console.log('✅ 用户已存在');
      console.log('   邮箱:', user.email);
      console.log('   昵称:', user.nickname);
      console.log('   当前状态:', user.status);
      console.log('');
      
      // 更新用户状态和认证
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'active',
          verified: true
        }
      });
      
      // 查找或创建admin角色
      let adminRole = await prisma.role.findUnique({
        where: { name: 'admin' }
      });
      
      if (!adminRole) {
        console.log('⚠️  admin角色不存在，正在创建...');
        adminRole = await prisma.role.create({
          data: {
            name: 'admin',
            displayName: '系统管理员',
            description: '拥有所有管理权限',
            level: 100,
            type: 'system',
            isActive: true
          }
        });
        console.log('✅ admin角色已创建');
      }
      
      // 检查是否已有管理员角色
      const existingRole = await prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: adminRole.id
          }
        }
      });
      
      if (!existingRole) {
        // 分配管理员角色
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: adminRole.id
          }
        });
        console.log('✅ 已分配管理员角色');
      } else {
        console.log('⚠️  用户已有管理员角色');
      }
      
      console.log('');
      console.log('✅ 已设置为管理员（拥有所有权限）');
      console.log('   用户ID:', updated.id);
      console.log('   邮箱:', updated.email);
      console.log('   昵称:', updated.nickname);
      console.log('   状态:', updated.status);
      console.log('   认证:', updated.verified);
      console.log('   管理员角色: 已分配');
      console.log('');
      
      // 检查角色权限
      const roles = await prisma.userRole.findMany({
        where: { userId: user.id }
      });
      
      if (roles.length > 0) {
        console.log('已分配的角色权限:');
        roles.forEach(r => {
          console.log(`   - ${r.roleId}`);
        });
      } else {
        console.log('提示: 如需更细粒度权限，请在数据库中配置 UserRole 表');
      }
      
    } else {
      console.log('❌ 用户不存在');
      console.log('');
      console.log('请先注册:');
      console.log('   1. 访问: https://test.ieclub.online');
      console.log('   2. 使用邮箱注册: ' + adminEmail);
      console.log('   3. 注册后再次运行此脚本');
      console.log('');
    }
    
    console.log('='.repeat(50));
    console.log('');
    
    await prisma.$disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ 错误:', error.message);
    console.error('');
    await prisma.$disconnect();
    process.exit(1);
  }
})();
