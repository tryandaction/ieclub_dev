// 清理测试用户脚本
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // 查找测试用户（保留星朵）
    const testUsers = await prisma.user.findMany({
      where: {
        nickname: { in: ['测试用户', '微信用户'] }
      }
    });
    
    console.log('找到测试用户:', testUsers.map(u => ({ id: u.id, nickname: u.nickname })));
    
    for (const user of testUsers) {
      console.log(`正在删除用户: ${user.nickname} (${user.id})`);
      
      // 删除用户相关的评论
      const deletedComments = await prisma.comment.deleteMany({ where: { authorId: user.id } });
      console.log(`  - 删除评论: ${deletedComments.count} 条`);
      
      // 删除用户相关的话题
      const deletedTopics = await prisma.topic.deleteMany({ where: { authorId: user.id } });
      console.log(`  - 删除话题: ${deletedTopics.count} 条`);
      
      // 删除用户
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`  - 用户已删除`);
    }
    
    console.log('\n✅ 清理完成！');
    
    // 显示剩余用户
    const remainingUsers = await prisma.user.findMany({
      select: { id: true, nickname: true, avatar: true }
    });
    console.log('\n剩余用户:', remainingUsers);
    
  } catch (error) {
    console.error('清理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
