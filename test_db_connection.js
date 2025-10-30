require('dotenv').config({ path: './.env' });

console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
    
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    const topicCount = await prisma.topic.count();
    console.log('Topic count:', topicCount);
    
    await prisma.$disconnect();
    console.log('✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();

