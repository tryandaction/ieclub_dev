// 初始化超级管理员脚本
const { PrismaClient } = require('@prisma/client');
const {
  hashPassword,
  getRolePermissions,
  ADMIN_ROLES,
} = require('../src/utils/adminAuth');

const prisma = new PrismaClient();

async function initSuperAdmin() {
  try {
    console.log('🚀 开始初始化超级管理员...\n');

    // 检查是否已存在超级管理员
    const existingAdmin = await prisma.admin.findFirst({
      where: { role: 'super_admin' },
    });

    if (existingAdmin) {
      console.log('⚠️  超级管理员已存在！');
      console.log(`   用户名: ${existingAdmin.username}`);
      console.log(`   邮箱: ${existingAdmin.email}\n`);
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      return new Promise((resolve) => {
        readline.question('是否要创建另一个超级管理员？(y/n): ', async (answer) => {
          readline.close();
          if (answer.toLowerCase() !== 'y') {
            console.log('\n操作已取消。');
            resolve();
            return;
          }
          await createAdmin();
          resolve();
        });
      });
    }

    await createAdmin();
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createAdmin() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => {
    return new Promise((resolve) => {
      readline.question(prompt, resolve);
    });
  };

  try {
    console.log('\n请输入超级管理员信息：\n');

    const username = await question('用户名: ');
    if (!username) {
      console.log('❌ 用户名不能为空');
      readline.close();
      return;
    }

    const email = await question('邮箱: ');
    if (!email) {
      console.log('❌ 邮箱不能为空');
      readline.close();
      return;
    }

    const password = await question('密码（至少8位，包含大小写字母、数字、特殊字符）: ');
    if (!password || password.length < 8) {
      console.log('❌ 密码不符合要求');
      readline.close();
      return;
    }

    const realName = await question('真实姓名（可选）: ');

    readline.close();

    console.log('\n正在创建超级管理员...');

    // 检查用户名是否已存在
    const existingByUsername = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingByUsername) {
      console.log('❌ 用户名已存在');
      return;
    }

    // 检查邮箱是否已存在
    const existingByEmail = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      console.log('❌ 邮箱已存在');
      return;
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 获取超级管理员权限
    const permissions = getRolePermissions('super_admin');

    // 创建超级管理员
    const admin = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'super_admin',
        permissions: JSON.stringify(permissions),
        status: 'active',
        realName: realName || null,
      },
    });

    console.log('\n✅ 超级管理员创建成功！\n');
    console.log('=' .repeat(50));
    console.log(`ID: ${admin.id}`);
    console.log(`用户名: ${admin.username}`);
    console.log(`邮箱: ${admin.email}`);
    console.log(`角色: ${ADMIN_ROLES.SUPER_ADMIN.name}`);
    console.log(`权限数量: ${permissions.length}`);
    console.log('=' .repeat(50));
    console.log('\n请使用以下信息登录管理后台：');
    console.log(`  邮箱: ${admin.email}`);
    console.log(`  密码: [您刚才输入的密码]`);
    console.log('\n⚠️  请妥善保管登录信息，建议首次登录后立即修改密码！\n');
  } catch (error) {
    console.error('❌ 创建失败:', error);
    readline.close();
  }
}

// 运行脚本
initSuperAdmin();

