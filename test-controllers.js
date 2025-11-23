console.log('Testing all controllers one by one...\n');

const controllers = [
  { name: 'AuthController', path: './src/controllers/authController' },
  { name: 'TokenController', path: './src/controllers/tokenController' },
  { name: 'CaptchaController', path: './src/controllers/captchaController' },
  { name: 'BindingController', path: './src/controllers/bindingController' },
  { name: 'topicController', path: './src/controllers/topicController' },
  { name: 'commentController', path: './src/controllers/commentController' },
  { name: 'UserController', path: './src/controllers/userController' },
  { name: 'searchController', path: './src/controllers/searchController' },
  { name: 'uploadController', path: './src/controllers/uploadController' },
  { name: 'announcementController', path: './src/controllers/announcementController' },
  { name: 'errorReportController', path: './src/controllers/errorReportController' },
  { name: 'LocalUploadService', path: './src/services/localUploadService' }
];

let hangDetected = false;

for (let i = 0; i < controllers.length; i++) {
  const ctrl = controllers[i];
  try {
    console.log(`[${i+1}/${controllers.length}] Loading ${ctrl.name}...`);
    
    // 设置超时检测
    const timeoutId = setTimeout(() => {
      console.error(`HANG DETECTED at ${ctrl.name}! This controller is blocking!`);
      hangDetected = true;
      process.exit(1);
    }, 3000);
    
    require(ctrl.path);
    clearTimeout(timeoutId);
    
    console.log(`   OK ${ctrl.name} loaded successfully`);
  } catch (err) {
    console.error(`   FAIL ${ctrl.name} failed: ${err.message}`);
    process.exit(1);
  }
}

if (!hangDetected) {
  console.log('\nAll controllers loaded successfully!');
  console.log('Now testing middleware...\n');
  
  // Test middleware
  const middlewares = [
    { name: 'authenticate', path: './src/middleware/auth' },
    { name: 'csrfProtection', path: './src/middleware/csrf' },
    { name: 'rateLimiters', path: './src/middleware/rateLimiter' },
    { name: 'requestLogger', path: './src/middleware/requestLogger' },
    { name: 'performanceMiddleware', path: './src/utils/performanceMonitor' }
  ];
  
  for (let i = 0; i < middlewares.length; i++) {
    const mw = middlewares[i];
    try {
      console.log(`[${i+1}/${middlewares.length}] Loading ${mw.name}...`);
      
      const timeoutId = setTimeout(() => {
        console.error(`HANG DETECTED at ${mw.name}!`);
        process.exit(1);
      }, 3000);
      
      require(mw.path);
      clearTimeout(timeoutId);
      
      console.log(`   OK ${mw.name} loaded successfully`);
    } catch (err) {
      console.error(`   FAIL ${mw.name} failed: ${err.message}`);
    }
  }
  
  console.log('\nAll components loaded! Safe to load routes.');
}
