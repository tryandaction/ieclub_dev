#!/usr/bin/env node
/**
 * 用户密码检查脚本
 * 用于诊断密码登录失败的问题
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function checkUser() {
  try {
    console.log('\n🔍 用户密码诊断工具\n')
    console.log('=' .repeat(50))
    
    // 输入邮箱
    const email = await question('请输入要检查的邮箱: ')
    
    if (!email) {
      console.log('❌ 邮箱不能为空')
      rl.close()
      return
    }
    
    // 查询用户
    console.log(`\n📡 正在查询用户: ${email}...`)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        password: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            loginLogs: true
          }
        }
      }
    })
    
    if (!user) {
      console.log('❌ 用户不存在')
      rl.close()
      return
    }
    
    console.log('\n✅ 用户信息:')
    console.log('  ID:', user.id)
    console.log('  邮箱:', user.email)
    console.log('  用户名:', user.username)
    console.log('  状态:', user.status)
    console.log('  注册时间:', user.createdAt)
    console.log('  最后登录:', user.lastLoginAt || '从未登录')
    console.log('  登录次数:', user._count.loginLogs)
    console.log('  密码哈希:', user.password ? user.password.substring(0, 20) + '...' : '未设置')
    console.log('  密码哈希长度:', user.password ? user.password.length : 0)
    console.log('  密码哈希格式:', user.password ? (user.password.startsWith('$2') ? 'bcrypt (✅ 正确)' : '❌ 非bcrypt格式！') : '❌ 未设置')
    
    // 检查密码
    console.log('\n' + '='.repeat(50))
    const testPassword = await question('请输入要测试的密码（直接回车跳过）: ')
    
    if (testPassword) {
      console.log('\n🔐 正在验证密码...')
      try {
        const isValid = await bcrypt.compare(testPassword, user.password)
        if (isValid) {
          console.log('✅ 密码正确！登录应该成功')
        } else {
          console.log('❌ 密码错误！这就是登录失败的原因')
        }
      } catch (error) {
        console.log('❌ 密码验证失败:', error.message)
        console.log('   可能的原因：密码哈希格式不正确')
      }
    }
    
    // 查询最近的登录日志
    console.log('\n' + '='.repeat(50))
    console.log('📊 最近5次登录记录:\n')
    const logs = await prisma.loginLog.findMany({
      where: { userId: user.id },
      orderBy: { loginTime: 'desc' },
      take: 5,
      select: {
        loginTime: true,
        loginMethod: true,
        status: true,
        failReason: true,
        ipAddress: true
      }
    })
    
    if (logs.length === 0) {
      console.log('  无登录记录')
    } else {
      logs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.loginTime.toLocaleString('zh-CN')}`)
        console.log(`     方式: ${log.loginMethod}`)
        console.log(`     状态: ${log.status}`)
        if (log.failReason) console.log(`     失败原因: ${log.failReason}`)
        console.log(`     IP: ${log.ipAddress}`)
        console.log()
      })
    }
    
    // 提供解决方案
    console.log('=' .repeat(50))
    console.log('\n💡 建议操作:\n')
    
    if (user.status !== 'active') {
      console.log('  ❌ 账户状态异常，需要激活账户')
    } else if (!user.password || !user.password.startsWith('$2')) {
      console.log('  ❌ 密码格式异常，需要重置密码')
      console.log('  方法1: 使用"忘记密码"功能重置')
      console.log('  方法2: 使用验证码登录，然后修改密码')
    } else {
      console.log('  ✅ 用户数据正常')
      console.log('  如果密码确认正确但仍然登录失败：')
      console.log('    1. 清除浏览器缓存（Ctrl+Shift+Delete）')
      console.log('    2. 使用验证码登录')
      console.log('    3. 登录后修改密码')
    }
    
    console.log('\n' + '='.repeat(50))
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message)
    console.error(error.stack)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

checkUser()
