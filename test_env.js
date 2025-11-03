const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.staging') });
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

