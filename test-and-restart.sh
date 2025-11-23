#!/bin/bash
cd /root/IEclub_dev/ieclub-backend
echo "Testing routes..."
node -e "const r=require('./src/routes'); console.log('✅ Routes loaded successfully')"
if [ $? -eq 0 ]; then
  echo "✅ Routes test passed!"
  pm2 restart ieclub-backend
  sleep 10
  echo "Checking health..."
  curl -s http://localhost:3000/api/health
  echo ""
  pm2 status
  pm2 save
  echo "✅ Server restarted and saved!"
else
  echo "❌ Routes test failed!"
  exit 1
fi
