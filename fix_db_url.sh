#!/bin/bash
# 修复测试环境的DATABASE_URL

cd /var/www/ieclub-backend-staging

# 备份原文件
cp .env.staging .env.staging.old

# 生成新文件，排除旧的DATABASE_URL行
grep -v '^DATABASE_URL=' .env.staging.old > .env.staging.tmp

# 添加正确的DATABASE_URL
cat >> .env.staging.tmp << 'EOFDB'
DATABASE_URL="mysql://ieclub_user:kE7pCg$r@W9nZ!sV2@127.0.0.1:3306/ieclub_staging"
EOFDB

# 替换原文件
mv .env.staging.tmp .env.staging

echo "DATABASE_URL updated successfully:"
grep DATABASE_URL .env.staging

