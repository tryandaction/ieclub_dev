require('dotenv').config();

try {
  console.log('Loading app...');
  const app = require('./src/app');
  console.log('✅ App loaded successfully');
  console.log('App type:', typeof app);
  console.log('Has listen:', typeof app.listen);
  
  // 尝试启动服务器
  const server = app.listen(3000, '0.0.0.0', () => {
    console.log('✅ Server started on port 3000');
    setTimeout(() => {
      server.close();
      console.log('✅ Test complete');
      process.exit(0);
    }, 2000);
  });
  
  server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Failed to load app:', error.message);
  console.error(error.stack);
  process.exit(1);
}
