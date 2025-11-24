// 测试PUT /api/profile接口
const axios = require('axios');

// 从环境变量或直接使用测试token
const token = process.env.TEST_TOKEN || 'your_token_here';

const testData = {
  nickname: "测试昵称",
  bio: "测试简介",
  gender: 0,
  school: "测试学校",
  skills: ["JavaScript", "Node.js"],
  interests: ["编程", "阅读"]
};

async function testPutProfile() {
  try {
    console.log('🚀 测试 PUT /api/profile');
    console.log('数据:', JSON.stringify(testData, null, 2));
    
    const response = await axios.put('https://ieclub.online/api/profile', testData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 成功:', response.data);
  } catch (error) {
    console.error('❌ 失败:');
    console.error('状态码:', error.response?.status);
    console.error('错误信息:', error.response?.data);
    console.error('完整错误:', error.message);
  }
}

testPutProfile();
