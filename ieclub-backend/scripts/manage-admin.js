#!/usr/bin/env node
// ============================================
// 管理员账号管理脚本
// ============================================
// 功能：添加、删除、列出、修改管理员账号
//
// 使用方法：
//   node scripts/manage-admin.js list              # 列出所有管理员
//   node scripts/manage-admin.js add               # 添加新管理员
//   node scripts/manage-admin.js remove <email>    # 删除管理员
//   node scripts/manage-admin.js reset <email>     # 重置管理员密码
//   node scripts/manage-admin.js change-role <email> <role>  # 修改角色
//
// 角色说明：
//   super_admin - 超级管理员（所有权限）
//   admin       - 普通管理员（大部分权限）
//   moderator   - 协调员（审核内容）
//   viewer      - 查看者（只读权限）
// ============================================

const { PrismaClient } = require('@prisma/client');
const {
  hashPassword,
  getRolePermissions,
  ADMIN_ROLES,
} = require('../src/utils/adminAuth');

const prisma = new PrismaClient();

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

// 交互式输入
function question(prompt) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    readline.question(prompt, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}

// ============================================
// 1. 列出所有管理员
// ============================================
async function listAdmins() {
  try {
    log('cyan', '\n📋 所有管理员账号：\n');

    const admins = await prisma.admin.findMany({
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    });

    if (admins.length === 0) {
      log('yellow', '⚠️  没有管理员账号！请先创建超级管理员。');
      log('blue', '\n运行: node scripts/init-admin.js\n');
      return;
    }

    console.log('='.repeat(100));
    console.log(
      '序号'.padEnd(6),
      '用户名'.padEnd(15),
      '邮箱'.padEnd(30),
      '角色'.padEnd(15),
      '状态'.padEnd(10),
      '创建时间'
    );
    console.log('='.repeat(100));

    admins.forEach((admin, index) => {
      const roleInfo = Object.values(ADMIN_ROLES).find((r) => r.value === admin.role);
      const roleName = roleInfo ? roleInfo.name : admin.role;
      const statusColor = admin.status === 'active' ? 'green' : 'red';
      const statusText = admin.status === 'active' ? '✅ 启用' : '❌ 禁用';

      console.log(
        `${(index + 1).toString().padEnd(6)}${admin.username.padEnd(15)}${admin.email.padEnd(30)}${roleName.padEnd(15)}`,
        colors[statusColor],
        statusText.padEnd(10),
        colors.reset,
        new Date(admin.createdAt).toLocaleString('zh-CN')
      );
    });

    console.log('='.repeat(100));
    log('cyan', `\n📊 总计: ${admins.length} 个管理员账号\n`);

    // 统计各角色数量
    const roleStats = {};
    admins.forEach((admin) => {
      roleStats[admin.role] = (roleStats[admin.role] || 0) + 1;
    });

    log('blue', '📈 角色分布:');
    Object.entries(roleStats).forEach(([role, count]) => {
      const roleInfo = Object.values(ADMIN_ROLES).find((r) => r.value === role);
      const roleName = roleInfo ? roleInfo.name : role;
      console.log(`   ${roleName}: ${count} 人`);
    });

    console.log('');
  } catch (error) {
    log('red', '❌ 列出管理员失败:', error.message);
  }
}

// ============================================
// 2. 添加新管理员
// ============================================
async function addAdmin() {
  try {
    log('cyan', '\n➕ 添加新管理员\n');

    // 显示可选角色
    log('blue', '可选角色:');
    Object.values(ADMIN_ROLES).forEach((role) => {
      console.log(`  ${role.value.padEnd(15)} - ${role.name} (${role.description})`);
    });
    console.log('');

    const username = await question('👤 用户名: ');
    if (!username || username.length < 3) {
      log('red', '❌ 用户名至少3个字符');
      return;
    }

    const email = await question('📧 邮箱: ');
    if (!email || !email.includes('@')) {
      log('red', '❌ 请输入有效的邮箱地址');
      return;
    }

    const password = await question('🔐 密码（至少8位，包含大小写字母、数字、特殊字符）: ');
    if (!password || password.length < 8) {
      log('red', '❌ 密码不符合要求');
      return;
    }

    const role = await question(
      '👔 角色 (super_admin/admin/moderator/viewer，默认: admin): '
    );
    const selectedRole = role || 'admin';

    if (!Object.values(ADMIN_ROLES).find((r) => r.value === selectedRole)) {
      log('red', '❌ 无效的角色');
      return;
    }

    const realName = await question('📝 真实姓名（可选，直接回车跳过）: ');

    // 检查用户名是否已存在
    const existingByUsername = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingByUsername) {
      log('red', '❌ 用户名已存在');
      return;
    }

    // 检查邮箱是否已存在
    const existingByEmail = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      log('red', '❌ 邮箱已存在');
      return;
    }

    log('yellow', '\n正在创建管理员...');

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 获取角色权限
    const permissions = getRolePermissions(selectedRole);

    // 创建管理员
    const admin = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: selectedRole,
        permissions: JSON.stringify(permissions),
        status: 'active',
        realName: realName || null,
      },
    });

    const roleInfo = Object.values(ADMIN_ROLES).find((r) => r.value === selectedRole);

    log('green', '\n✅ 管理员创建成功！\n');
    console.log('='.repeat(60));
    console.log(`ID:       ${admin.id}`);
    console.log(`用户名:   ${admin.username}`);
    console.log(`邮箱:     ${admin.email}`);
    console.log(`角色:     ${roleInfo.name}`);
    console.log(`权限:     ${permissions.length} 项`);
    console.log(`状态:     ${admin.status === 'active' ? '✅ 启用' : '❌ 禁用'}`);
    console.log('='.repeat(60));

    log('blue', '\n📌 登录信息:');
    console.log(`  管理后台: https://ieclub.online/admin`);
    console.log(`  邮箱:     ${admin.email}`);
    console.log(`  密码:     [您刚才输入的密码]`);
    console.log('');
  } catch (error) {
    log('red', '❌ 添加管理员失败:', error.message);
  }
}

// ============================================
// 3. 删除管理员
// ============================================
async function removeAdmin(email) {
  try {
    if (!email) {
      log('red', '❌ 请提供要删除的管理员邮箱');
      log('blue', '\n用法: node scripts/manage-admin.js remove <email>\n');
      return;
    }

    log('yellow', `\n🔍 查找管理员: ${email}\n`);

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      log('red', '❌ 未找到该管理员');
      return;
    }

    const roleInfo = Object.values(ADMIN_ROLES).find((r) => r.value === admin.role);

    console.log('找到管理员:');
    console.log(`  用户名: ${admin.username}`);
    console.log(`  邮箱:   ${admin.email}`);
    console.log(`  角色:   ${roleInfo.name}`);
    console.log('');

    // 如果是超级管理员，检查是否还有其他超级管理员
    if (admin.role === 'super_admin') {
      const superAdminCount = await prisma.admin.count({
        where: { role: 'super_admin', status: 'active' },
      });

      if (superAdminCount <= 1) {
        log('red', '❌ 不能删除最后一个超级管理员！');
        log('yellow', '   建议: 先添加另一个超级管理员，再删除此账号。');
        return;
      }
    }

    const confirm = await question('⚠️  确认删除此管理员？(yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      log('blue', '操作已取消');
      return;
    }

    await prisma.admin.delete({
      where: { email },
    });

    log('green', '\n✅ 管理员已删除\n');
  } catch (error) {
    log('red', '❌ 删除管理员失败:', error.message);
  }
}

// ============================================
// 4. 重置管理员密码
// ============================================
async function resetPassword(email) {
  try {
    if (!email) {
      log('red', '❌ 请提供要重置密码的管理员邮箱');
      log('blue', '\n用法: node scripts/manage-admin.js reset <email>\n');
      return;
    }

    log('yellow', `\n🔍 查找管理员: ${email}\n`);

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      log('red', '❌ 未找到该管理员');
      return;
    }

    console.log('找到管理员:');
    console.log(`  用户名: ${admin.username}`);
    console.log(`  邮箱:   ${admin.email}`);
    console.log('');

    const newPassword = await question('🔐 新密码（至少8位，包含大小写字母、数字、特殊字符）: ');
    if (!newPassword || newPassword.length < 8) {
      log('red', '❌ 密码不符合要求');
      return;
    }

    const confirmPassword = await question('🔐 确认新密码: ');
    if (newPassword !== confirmPassword) {
      log('red', '❌ 两次输入的密码不一致');
      return;
    }

    log('yellow', '\n正在重置密码...');

    const hashedPassword = await hashPassword(newPassword);

    await prisma.admin.update({
      where: { email },
      data: { password: hashedPassword },
    });

    log('green', '\n✅ 密码重置成功！\n');
    log('blue', '新的登录信息:');
    console.log(`  邮箱: ${admin.email}`);
    console.log(`  密码: [您刚才输入的新密码]`);
    console.log('');
  } catch (error) {
    log('red', '❌ 重置密码失败:', error.message);
  }
}

// ============================================
// 5. 修改管理员角色
// ============================================
async function changeRole(email, newRole) {
  try {
    if (!email || !newRole) {
      log('red', '❌ 请提供邮箱和新角色');
      log('blue', '\n用法: node scripts/manage-admin.js change-role <email> <role>\n');
      log('blue', '可选角色:');
      Object.values(ADMIN_ROLES).forEach((role) => {
        console.log(`  ${role.value.padEnd(15)} - ${role.name}`);
      });
      console.log('');
      return;
    }

    if (!Object.values(ADMIN_ROLES).find((r) => r.value === newRole)) {
      log('red', '❌ 无效的角色');
      return;
    }

    log('yellow', `\n🔍 查找管理员: ${email}\n`);

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      log('red', '❌ 未找到该管理员');
      return;
    }

    const oldRoleInfo = Object.values(ADMIN_ROLES).find((r) => r.value === admin.role);
    const newRoleInfo = Object.values(ADMIN_ROLES).find((r) => r.value === newRole);

    console.log('找到管理员:');
    console.log(`  用户名:   ${admin.username}`);
    console.log(`  邮箱:     ${admin.email}`);
    console.log(`  当前角色: ${oldRoleInfo.name}`);
    console.log(`  新角色:   ${newRoleInfo.name}`);
    console.log('');

    // 如果是从超级管理员降级，检查是否还有其他超级管理员
    if (admin.role === 'super_admin' && newRole !== 'super_admin') {
      const superAdminCount = await prisma.admin.count({
        where: { role: 'super_admin', status: 'active' },
      });

      if (superAdminCount <= 1) {
        log('red', '❌ 不能降级最后一个超级管理员！');
        log('yellow', '   建议: 先添加或升级另一个超级管理员。');
        return;
      }
    }

    const confirm = await question('⚠️  确认修改角色？(yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      log('blue', '操作已取消');
      return;
    }

    log('yellow', '\n正在修改角色...');

    const permissions = getRolePermissions(newRole);

    await prisma.admin.update({
      where: { email },
      data: {
        role: newRole,
        permissions: JSON.stringify(permissions),
      },
    });

    log('green', '\n✅ 角色修改成功！\n');
    console.log(`${admin.username} 的角色已从 ${oldRoleInfo.name} 变更为 ${newRoleInfo.name}`);
    console.log(`新权限数量: ${permissions.length} 项`);
    console.log('');
  } catch (error) {
    log('red', '❌ 修改角色失败:', error.message);
  }
}

// ============================================
// 6. 启用/禁用管理员
// ============================================
async function toggleStatus(email) {
  try {
    if (!email) {
      log('red', '❌ 请提供要操作的管理员邮箱');
      log('blue', '\n用法: node scripts/manage-admin.js toggle <email>\n');
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      log('red', '❌ 未找到该管理员');
      return;
    }

    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? '启用' : '禁用';

    console.log(`\n将要${action}管理员: ${admin.username} (${admin.email})`);

    if (admin.role === 'super_admin' && newStatus === 'inactive') {
      const activeSuperAdminCount = await prisma.admin.count({
        where: { role: 'super_admin', status: 'active' },
      });

      if (activeSuperAdminCount <= 1) {
        log('red', '❌ 不能禁用最后一个活跃的超级管理员！');
        return;
      }
    }

    const confirm = await question(`⚠️  确认${action}此管理员？(yes/no): `);

    if (confirm.toLowerCase() !== 'yes') {
      log('blue', '操作已取消');
      return;
    }

    await prisma.admin.update({
      where: { email },
      data: { status: newStatus },
    });

    log('green', `\n✅ 管理员已${action}\n`);
  } catch (error) {
    log('red', '❌ 操作失败:', error.message);
  }
}

// ============================================
// 显示帮助信息
// ============================================
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              🔧 管理员账号管理工具 v2.0                    ║
╚════════════════════════════════════════════════════════════╝

📋 使用方法:

  node scripts/manage-admin.js <命令> [参数]

🎯 可用命令:

  list                              列出所有管理员
  add                               添加新管理员（交互式）
  remove <email>                    删除指定管理员
  reset <email>                     重置管理员密码
  change-role <email> <role>        修改管理员角色
  toggle <email>                    启用/禁用管理员
  help                              显示此帮助信息

👔 可用角色:

  super_admin   超级管理员（所有权限）
  admin         普通管理员（大部分权限）
  moderator     协调员（审核内容）
  viewer        查看者（只读权限）

📝 示例:

  # 列出所有管理员
  node scripts/manage-admin.js list

  # 添加新管理员
  node scripts/manage-admin.js add

  # 删除管理员
  node scripts/manage-admin.js remove admin@example.com

  # 重置密码
  node scripts/manage-admin.js reset admin@example.com

  # 修改角色（升级为超级管理员）
  node scripts/manage-admin.js change-role admin@example.com super_admin

  # 禁用管理员
  node scripts/manage-admin.js toggle admin@example.com

🔒 安全提示:

  • 密码必须至少8位，包含大小写字母、数字和特殊字符
  • 至少保留一个活跃的超级管理员
  • 妥善保管管理员登录信息
  • 定期更换密码

═══════════════════════════════════════════════════════════

`);
}

// ============================================
// 主函数
// ============================================
async function main() {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  try {
    switch (command) {
      case 'list':
        await listAdmins();
        break;
      case 'add':
        await addAdmin();
        break;
      case 'remove':
        await removeAdmin(arg1);
        break;
      case 'reset':
        await resetPassword(arg1);
        break;
      case 'change-role':
        await changeRole(arg1, arg2);
        break;
      case 'toggle':
        await toggleStatus(arg1);
        break;
      case 'help':
      case '-h':
      case '--help':
        showHelp();
        break;
      default:
        if (!command) {
          showHelp();
        } else {
          log('red', `\n❌ 未知命令: ${command}\n`);
          showHelp();
        }
    }
  } catch (error) {
    log('red', '\n❌ 执行失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行主函数
main();

