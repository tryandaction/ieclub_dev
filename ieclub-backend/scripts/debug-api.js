require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/database');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWo0NmZzZ3UwMDA4cjc5eW5vNW50cjdoIiwiaWF0IjoxNzM0MTkyMDI3fQ.C8VUuIxSyIHkGSqfzV2P3AgAm4T-MQlQ_qX_jLSYvOI';
const activityId = 'cmj5tey4h0001565r94n138rr';

async function test() {
  console.log('=== JWT Test ===');
  let userId = null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('JWT Valid, userId:', decoded.userId);
    userId = decoded.userId;
  } catch(e) {
    console.log('JWT Error:', e.message);
    return;
  }

  console.log('\n=== Activity Test ===');
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, title: true, endTime: true, startTime: true, organizerId: true }
    });
    console.log('Activity found:', activity);
    
    if (activity) {
      console.log('startTime type:', typeof activity.startTime);
      console.log('endTime type:', typeof activity.endTime);
      console.log('startTime value:', activity.startTime);
      console.log('endTime value:', activity.endTime);
    }
  } catch(e) {
    console.log('Activity Error:', e.message);
  }

  console.log('\n=== User Test ===');
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, status: true }
    });
    console.log('User found:', user);
  } catch(e) {
    console.log('User Error:', e.message);
  }

  console.log('\n=== Join Activity Test ===');
  try {
    // Check if already participating
    const existing = await prisma.activityParticipant.findUnique({
      where: {
        activityId_userId: { activityId, userId }
      }
    });
    console.log('Existing participation:', existing);
  } catch(e) {
    console.log('Participation Check Error:', e.message);
  }

  await prisma.$disconnect();
}

test().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
