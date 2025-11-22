#!/usr/bin/env node
/**
 * 清除登录失败记录脚本
 * 用于解决429限流问题
 */

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function clearLoginFailures() {
  try {
    console.log('\n🔧 清除登录失败记录工具\n')
    console.log('=' .repeat(50))
    
    // 输入邮箱
    const email = await question('请输入要清除失败记录的邮箱（留空则清除所有）: ')
    
    if (email) {
      // 查询用户
      const user = await prisma.user.findUnique({
        where: { email }
      })
      
      if (!user) {
        console.log('❌ 用户不存在')
        rl.close()
        return
      }
      
      console.log(`\n📊 用户: ${email}`)
      
      // 查询失败记录数
      const failedCount = await prisma.loginLog.count({
        where: {
          userId: user.id,
          status: 'failed'
        }
      })
      
      console.log(`   失败记录数: ${failedCount}`)
      
      if (failedCount === 0) {
        console.log('✅ 没有失败记录需要清除')
        rl.close()
        return
      }
      
      const confirm = await question(`\n⚠️  确认清除 ${email} 的所有 ${failedCount} 条失败记录？(Y/N): `)
      
      if (confirm.toLowerCase() !== 'y') {
        console.log('❌ 操作已取消')
        rl.close()
        return
      }
      
      // 删除失败记录
      const result = await prisma.loginLog.deleteMany({
        where: {
          userId: user.id,
          status: 'failed'
        }
      })
      
      console.log(`\n✅ 已清除 ${result.count} 条失败记录`)
      console.log('💡 现在可以尝试重新登录了')
      
    } else {
      // 清除所有用户的失败记录
      console.log('\n⚠️  您选择清除所有用户的失败记录')
      
      const failedCount = await prisma.loginLog.count({
        where: {
          status: 'failed'
        }
      })
      
      console.log(`   总失败记录数: ${failedCount}`)
      
      if (failedCount === 0) {
        console.log('✅ 没有失败记录需要清除')
        rl.close()
        return
      }
      
      const confirm = await question(`\n⚠️  确认清除所有用户的 ${failedCount} 条失败记录？(Y/N): `)
      
      if (confirm.toLowerCase() !== 'y') {
        console.log('❌ 操作已取消')
        rl.close()
        return
      }
      
      // 删除所有失败记录
      const result = await prisma.loginLog.deleteMany({
        where: {
          status: 'failed'
        }
      })
      
      console.log(`\n✅ 已清除 ${result.count} 条失败记录`)
      console.log('💡 所有用户现在都可以尝试重新登录了')
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

clearLoginFailures()
