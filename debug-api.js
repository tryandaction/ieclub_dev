// 直接测试问题API
const axios = require('axios');

async function testAPIs() {
  console.log('=== 测试 /api/health ===');
  try {
    const start1 = Date.now();
    const res1 = await axios.get('http://localhost:3000/api/health');
    console.log('✅ 耗时:', Date.now() - start1, 'ms');
    console.log('✅ 响应:', res1.data);
  } catch (e) {
    console.error('❌ 错误:', e.message);
  }

  console.log('\n=== 测试 GET /api/auth/profile（需要token）===');
  try {
    const start2 = Date.now();
    const res2 = await axios.get('http://localhost:3000/api/auth/profile', {
      headers: { 'Authorization': 'Bearer invalid_token' }
    });
    console.log('✅ 耗时:', Date.now() - start2, 'ms');
  } catch (e) {
    console.log('⚠️  耗时:', Date.now() - start2, 'ms');
    console.log('⚠️  状态:', e.response?.status);
    console.log('⚠️  错误:', e.response?.data || e.message);
  }

  console.log('\n=== 测试 PUT /api/profile（需要token）===');
  try {
    const start3 = Date.now();
    const res3 = await axios.put('http://localhost:3000/api/profile', 
      { nickname: 'test' },
      { headers: { 'Authorization': 'Bearer invalid_token' } }
    );
    console.log('✅ 耗时:', Date.now() - start3, 'ms');
  } catch (e) {
    console.log('⚠️  耗时:', Date.now() - start3, 'ms');
    console.log('⚠️  状态:', e.response?.status);
    console.log('⚠️  错误:', e.response?.data || e.message);
  }

  process.exit(0);
}

testAPIs();
