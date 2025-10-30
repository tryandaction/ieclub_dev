// Test routes loading
const routes = require('./ieclub-backend/src/routes/index');

console.log('Routes loaded successfully!');
console.log('\nAuth routes:');
routes.stack
  .filter(r => r.route && r.route.path.includes('auth'))
  .forEach(r => {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`  ${methods} ${r.route.path}`);
  });

console.log('\nAll routes count:', routes.stack.filter(r => r.route).length);

