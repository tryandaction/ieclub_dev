// Test loading app and routes
const path = require('path');

console.log('Current directory:', __dirname);
console.log('Testing routes loading...\n');

try {
  const app = require('./ieclub-backend/src/app');
  console.log('✅ App loaded successfully');
  
  // Get all routes
  const router = app._router;
  if (router && router.stack) {
    console.log('\nRegistered routes:');
    const routes = router.stack
      .filter(r => r.route)
      .map(r => ({
        path: r.route.path,
        methods: Object.keys(r.route.methods).join(', ').toUpperCase()
      }));
    
    console.log(`Total routes found: ${routes.length}`);
    routes.slice(0, 20).forEach(r => {
      console.log(`  ${r.methods} ${r.path}`);
    });
  }
} catch (error) {
  console.error('❌ Error loading app:', error.message);
  console.error(error.stack);
}

