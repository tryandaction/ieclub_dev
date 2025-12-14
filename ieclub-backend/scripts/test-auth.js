require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/database');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWhlYWNkemkwMDA1MTNyYTBxenl5NndtIiwiaWF0IjoxNzM0MTQyNzY1fQ.zkk-GIxXngLIiKZmmNYQbpKylZ753CbKI';

async function test() {
  try {
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('JWT decoded:', decoded);
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    console.log('User found:', user ? user.nickname : 'NOT FOUND');
    
    const activity = await prisma.activity.findUnique({
      where: { id: 'cmj5capvx0003asbc71l5rpjp' },
      select: { id: true, title: true, endTime: true, startTime: true }
    });
    console.log('Activity:', activity);
    console.log('endTime:', activity.endTime, 'type:', typeof activity.endTime);
    console.log('startTime:', activity.startTime, 'type:', typeof activity.startTime);
    
    // Test formatActivity behavior
    console.log('endTime?.toISOString():', activity.endTime?.toISOString());
    console.log('startTime?.toISOString():', activity.startTime?.toISOString());
  } catch(e) {
    console.log('Error:', e.message);
    console.log(e.stack);
  } finally {
    await prisma.$disconnect();
  }
}
test();
