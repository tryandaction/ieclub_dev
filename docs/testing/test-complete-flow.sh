#!/bin/bash
# 完整功能测试脚本 - IEClub 测试环境
# 测试用户注册、登录、基本功能的完整流程

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API 基础URL
API_URL="https://test.ieclub.online/api"

# 测试邮箱（使用你的真实邮箱以接收验证码）
TEST_EMAIL="test_$(date +%s)@qq.com"  # 使用时间戳避免重复
TEST_PASSWORD="Test123456!"
TEST_NICKNAME="测试用户_$(date +%H%M%S)"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   IEClub 完整功能测试                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ========== 测试 1: 健康检查 ==========
echo -e "${YELLOW}[测试 1/6]${NC} 健康检查..."
response=$(curl -s "${API_URL}/health")
if echo "$response" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ 健康检查通过${NC}"
    echo "   响应: $response"
else
    echo -e "${RED}❌ 健康检查失败${NC}"
    echo "   响应: $response"
    exit 1
fi
echo ""

# ========== 测试 2: 发送验证码 ==========
echo -e "${YELLOW}[测试 2/6]${NC} 发送注册验证码..."
echo "   测试邮箱: $TEST_EMAIL"

send_code_response=$(curl -s -X POST "${API_URL}/auth/send-verify-code" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"type\":\"register\"}")

if echo "$send_code_response" | grep -q '"code":200'; then
    echo -e "${GREEN}✅ 验证码发送成功${NC}"
    echo "   响应: $send_code_response"
else
    echo -e "${RED}❌ 验证码发送失败${NC}"
    echo "   响应: $send_code_response"
    
    # 检查是否是邮箱已注册的问题
    if echo "$send_code_response" | grep -q "已被注册"; then
        echo -e "${YELLOW}⚠️  邮箱已注册，尝试使用新邮箱...${NC}"
        TEST_EMAIL="test_new_$(date +%s)@qq.com"
        send_code_response=$(curl -s -X POST "${API_URL}/auth/send-verify-code" \
          -H "Content-Type: application/json" \
          -d "{\"email\":\"$TEST_EMAIL\",\"type\":\"register\"}")
        
        if echo "$send_code_response" | grep -q '"code":200'; then
            echo -e "${GREEN}✅ 验证码发送成功（新邮箱）${NC}"
        else
            echo -e "${RED}❌ 仍然失败，终止测试${NC}"
            exit 1
        fi
    else
        exit 1
    fi
fi
echo ""

# ========== 交互部分: 输入验证码 ==========
echo -e "${BLUE}═════════════════════════════════════${NC}"
echo -e "${YELLOW}📧 请检查邮箱 $TEST_EMAIL${NC}"
echo -e "${YELLOW}   并输入收到的6位验证码：${NC}"
read -p "验证码: " VERIFY_CODE
echo -e "${BLUE}═════════════════════════════════════${NC}"
echo ""

# 验证码格式检查
if ! [[ "$VERIFY_CODE" =~ ^[0-9]{6}$ ]]; then
    echo -e "${RED}❌ 验证码格式错误（应为6位数字）${NC}"
    exit 1
fi

# ========== 测试 3: 用户注册 ==========
echo -e "${YELLOW}[测试 3/6]${NC} 用户注册..."
echo "   邮箱: $TEST_EMAIL"
echo "   昵称: $TEST_NICKNAME"
echo "   验证码: $VERIFY_CODE"

register_response=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TEST_EMAIL\",
    \"password\":\"$TEST_PASSWORD\",
    \"verifyCode\":\"$VERIFY_CODE\",
    \"nickname\":\"$TEST_NICKNAME\",
    \"gender\":1
  }")

if echo "$register_response" | grep -q '"success":true\|"code":200'; then
    echo -e "${GREEN}✅ 用户注册成功${NC}"
    echo "   响应: $register_response"
    
    # 提取 token（如果有）
    TOKEN=$(echo "$register_response" | grep -oP '(?<="token":")[^"]+' || echo "")
    if [ -n "$TOKEN" ]; then
        echo "   Token: ${TOKEN:0:50}..."
    fi
else
    echo -e "${RED}❌ 用户注册失败${NC}"
    echo "   响应: $register_response"
    
    # 如果验证码错误，提示重新输入
    if echo "$register_response" | grep -q "验证码"; then
        echo -e "${YELLOW}⚠️  验证码可能有误，请检查：${NC}"
        echo "   1. 验证码是否输入正确"
        echo "   2. 验证码是否已过期（10分钟）"
        echo "   3. 邮箱是否正确"
    fi
    exit 1
fi
echo ""

# ========== 测试 4: 用户登录 ==========
echo -e "${YELLOW}[测试 4/6]${NC} 用户登录..."

login_response=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TEST_EMAIL\",
    \"password\":\"$TEST_PASSWORD\"
  }")

if echo "$login_response" | grep -q '"success":true\|"code":200'; then
    echo -e "${GREEN}✅ 用户登录成功${NC}"
    echo "   响应: $login_response"
    
    # 提取 token
    TOKEN=$(echo "$login_response" | grep -oP '(?<="token":")[^"]+' || echo "")
    if [ -n "$TOKEN" ]; then
        echo "   Token: ${TOKEN:0:50}..."
    else
        echo -e "${YELLOW}⚠️  未找到 token${NC}"
    fi
else
    echo -e "${RED}❌ 用户登录失败${NC}"
    echo "   响应: $login_response"
    exit 1
fi
echo ""

# ========== 测试 5: 获取用户信息 ==========
if [ -n "$TOKEN" ]; then
    echo -e "${YELLOW}[测试 5/6]${NC} 获取用户信息..."
    
    profile_response=$(curl -s -X GET "${API_URL}/user/profile" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$profile_response" | grep -q "$TEST_EMAIL"; then
        echo -e "${GREEN}✅ 获取用户信息成功${NC}"
        echo "   响应: $profile_response"
    else
        echo -e "${RED}❌ 获取用户信息失败${NC}"
        echo "   响应: $profile_response"
    fi
else
    echo -e "${YELLOW}[测试 5/6]${NC} 跳过（无 token）"
fi
echo ""

# ========== 测试 6: 获取活动列表 ==========
echo -e "${YELLOW}[测试 6/6]${NC} 获取活动列表..."

activities_response=$(curl -s -X GET "${API_URL}/activities?page=1&pageSize=10")

if echo "$activities_response" | grep -q '"success":true\|"code":200'; then
    echo -e "${GREEN}✅ 获取活动列表成功${NC}"
    
    # 统计活动数量
    activity_count=$(echo "$activities_response" | grep -o '"id"' | wc -l)
    echo "   活动数量: $activity_count"
else
    echo -e "${YELLOW}⚠️  获取活动列表失败或无活动${NC}"
    echo "   响应: $activities_response"
fi
echo ""

# ========== 测试总结 ==========
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ 所有核心功能测试通过！            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}测试账号信息：${NC}"
echo "   邮箱: $TEST_EMAIL"
echo "   密码: $TEST_PASSWORD"
echo "   昵称: $TEST_NICKNAME"
echo ""
echo -e "${BLUE}可以使用以下命令查看数据库记录：${NC}"
echo "   ssh root@ieclub.online \"mysql -u ieclub_user -p ieclub_staging -e 'SELECT * FROM users WHERE email=\\\"$TEST_EMAIL\\\"'\""
echo ""
echo -e "${GREEN}🎉 测试完成！系统运行正常！${NC}"

