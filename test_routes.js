// 测试路由加载
try {
  console.log('开始加载路由...');
  const routes = require('/var/www/ieclub_dev/ieclub-backend/src/routes');
  console.log('路由加载成功');
  console.log('路由类型:', typeof routes);
  console.log('路由堆栈长度:', routes.stack ? routes.stack.length : '无堆栈');
  
  // 检查路由
  if (routes.stack) {
    console.log('已注册的路由:');
    routes.stack.forEach((layer, index) => {
      console.log(`${index + 1}. ${layer.route ? layer.route.path : '中间件'} - ${layer.route ? Object.keys(layer.route.methods).join(',') : 'N/A'}`);
    });
  }
} catch (error) {
  console.error('路由加载失败:', error.message);
  console.error('错误堆栈:', error.stack);
}
