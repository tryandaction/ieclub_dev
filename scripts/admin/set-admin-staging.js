// 在测试环境设置管理员
require('dotenv').config({path: '.env.staging'});
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const adminEmail = '12310203@mail.sustech.edu.cn';

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
      console.log('   当前角色:', user.role);
      console.log('   当前状态:', user.status);
      console.log('');
      
      // 更新为管理员
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'admin',
          status: 'active',
          isCertified: true,
          isVip: true
        }
      });
      
      console.log('✅ 已设置为管理员（拥有所有权限）');
      console.log('   用户ID:', updated.id);
      console.log('   邮箱:', updated.email);
      console.log('   角色:', updated.role);
      console.log('   状态:', updated.status);
      console.log('   认证:', updated.isCertified);
      console.log('   VIP:', updated.isVip);
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
