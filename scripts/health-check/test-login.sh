#!/bin/bash
###############################################################################
# 登录功能测试脚本
# 用途: 测试API登录端点是否正常工作
# 使用: bash test-login.sh [环境]
# 环境: local (默认) | staging | production
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取环境参数
ENVIRONMENT=${1:-local}

# 根据环境设置API URL
case $ENVIRONMENT in
  local)
    API_URL="http://localhost:3000"
    ;;
  staging)
    API_URL="http://localhost:3001"
    ;;
  production)
    API_URL="http://localhost:3000"
    ;;
  *)
    echo -e "${RED}❌ 未知环境: $ENVIRONMENT${NC}"
    echo "使用方式: bash test-login.sh [local|staging|production]"
    exit 1
    ;;
esac

echo -e "${BLUE}=== IEClub 登录功能测试 ===${NC}"
echo -e "环境: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "API URL: ${YELLOW}$API_URL${NC}"
echo ""

# 测试用户凭据
TEST_EMAIL="admin@sustech.edu.cn"
TEST_PASSWORD="Test123456"

# 创建临时文件存储请求数据
TMP_FILE=$(mktemp)
cat > "$TMP_FILE" << EOF
{
  "email": "$TEST_EMAIL",
  "password": "$TEST_PASSWORD"
}
EOF

echo -e "${BLUE}📝 测试数据:${NC}"
cat "$TMP_FILE"
echo ""

# 测试1: 健康检查
echo -e "${BLUE}🔍 测试1: 健康检查${NC}"
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
echo "响应: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✅ 健康检查通过${NC}"
else
  echo -e "${RED}❌ 健康检查失败${NC}"
  rm -f "$TMP_FILE"
  exit 1
fi
echo ""

# 测试2: 登录API (正确的Content-Type)
echo -e "${BLUE}🔍 测试2: 登录API (带Content-Type)${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d @"$TMP_FILE")

echo "响应: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ 登录成功${NC}"
  
  # 提取token
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}🔑 Token: ${TOKEN:0:50}...${NC}"
  fi
else
  echo -e "${RED}❌ 登录失败${NC}"
  
  # 检查常见错误
  if echo "$LOGIN_RESPONSE" | grep -q "请使用南科大邮箱"; then
    echo -e "${YELLOW}💡 提示: 可能是Content-Type未正确设置导致body为空${NC}"
  elif echo "$LOGIN_RESPONSE" | grep -q "邮箱或密码错误"; then
    echo -e "${YELLOW}💡 提示: 请先运行 create-test-user.js 创建测试用户${NC}"
  fi
fi
echo ""

# 测试3: 登录API (缺少Content-Type - 应该失败)
echo -e "${BLUE}🔍 测试3: 登录API (不带Content-Type，预期失败)${NC}"
WRONG_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -d @"$TMP_FILE")

echo "响应: $WRONG_RESPONSE"

if echo "$WRONG_RESPONSE" | grep -q "请使用南科大邮箱"; then
  echo -e "${GREEN}✅ 预期的失败: Content-Type缺失时无法解析JSON${NC}"
else
  echo -e "${YELLOW}⚠️  非预期响应${NC}"
fi
echo ""

# 测试4: 使用Token获取用户信息
if [ -n "$TOKEN" ]; then
  echo -e "${BLUE}🔍 测试4: 使用Token获取用户信息${NC}"
  PROFILE_RESPONSE=$(curl -s "$API_URL/api/auth/profile" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "响应: $PROFILE_RESPONSE"
  
  if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 获取用户信息成功${NC}"
  else
    echo -e "${RED}❌ 获取用户信息失败${NC}"
  fi
  echo ""
fi

# 清理临时文件
rm -f "$TMP_FILE"

echo -e "${BLUE}=== 测试完成 ===${NC}"
echo ""
echo -e "${YELLOW}测试总结:${NC}"
echo "1. 健康检查: 验证服务是否运行"
echo "2. 正确登录: 验证带Content-Type的请求能成功"
echo "3. 错误登录: 验证缺少Content-Type会导致解析失败"
if [ -n "$TOKEN" ]; then
  echo "4. Token验证: 验证JWT token有效性"
fi
echo ""
echo -e "${GREEN}✅ 所有测试完成！${NC}"
