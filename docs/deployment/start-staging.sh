#!/bin/bash
# 测试环境启动脚本

cd /root/IEclub_dev_staging/ieclub-backend

# 复制.env.staging为.env
cp .env.staging .env

# 启动服务（使用简化版server）
node server-simple.js

