// 检查并清理重复活动的脚本
const prisma = require('../src/config/database');

async function main() {
  // 查看所有活动
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, createdAt: true }
  });
  
  console.log('当前活动列表:');
  console.log(JSON.stringify(activities, null, 2));
  
  // 找出重复的活动（同标题）
  const titleMap = new Map();
  const duplicates = [];
  
  for (const activity of activities) {
    if (titleMap.has(activity.title)) {
      duplicates.push(activity.id);
    } else {
      titleMap.set(activity.title, activity.id);
    }
  }
  
  if (duplicates.length > 0) {
    console.log('\n发现重复活动，准备删除:', duplicates);
    
    // 删除重复的活动
    for (const id of duplicates) {
      await prisma.activity.delete({ where: { id } });
      console.log('已删除:', id);
    }
  } else {
    console.log('\n没有发现重复活动');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
