require('dotenv').config();
const prisma = require('../src/config/database');

async function test() {
  try {
    console.log('=== Testing Activity Query ===');
    
    const activity = await prisma.activity.findUnique({
      where: { id: 'cmj5th7zg0005565rerk66xhf' },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
        organizer: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true
          }
        }
      }
    });
    
    console.log('Activity found:', !!activity);
    if (activity) {
      console.log('Title:', activity.title);
      console.log('startTime:', activity.startTime, typeof activity.startTime);
      console.log('endTime:', activity.endTime, typeof activity.endTime);
      console.log('createdAt:', activity.createdAt, typeof activity.createdAt);
      console.log('updatedAt:', activity.updatedAt, typeof activity.updatedAt);
      console.log('organizer:', activity.organizer);
      
      // Test formatActivity-like operation
      console.log('\n=== Testing toISOString ===');
      console.log('startTime?.toISOString():', activity.startTime?.toISOString());
      console.log('endTime?.toISOString():', activity.endTime?.toISOString());
      console.log('createdAt?.toISOString():', activity.createdAt?.toISOString());
      console.log('updatedAt?.toISOString():', activity.updatedAt?.toISOString());
    }
  } catch(e) {
    console.log('Error:', e.message);
    console.log('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
