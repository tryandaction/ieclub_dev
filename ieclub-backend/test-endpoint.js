// 独立测试端点 - 绕过所有中间件直接测试
const express = require('express');
const app = express();

app.use(express.json());

// 最简单的PUT测试
app.put('/test-put', (req, res) => {
  console.log('✅ TEST PUT received');
  console.log('Body:', req.body);
  res.json({
    success: true,
    message: 'PUT works!',
    body: req.body
  });
});

// 测试带认证的PUT
app.put('/test-auth-put', (req, res) => {
  console.log('✅ TEST AUTH PUT received');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({
    success: true,
    message: 'Auth PUT works!',
    headers: req.headers,
    body: req.body
  });
});

app.listen(3001, () => {
  console.log('✅ Test server running on port 3001');
  console.log('Test: curl -X PUT http://localhost:3001/test-put -H "Content-Type: application/json" -d \'{"test":"data"}\'');
});
