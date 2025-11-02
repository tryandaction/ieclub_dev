#!/bin/bash

# IEClub 后端优化应用脚本
# 用途：自动应用所有优化配置

set -e  # 遇到错误立即退出

echo "========================================="
echo "  IEClub 后端优化应用脚本"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在 ieclub-backend 目录下运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}步骤 1/5: 检查依赖...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装 Node.js${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未安装 npm${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js 和 npm 已安装${NC}"
echo ""

echo -e "${YELLOW}步骤 2/5: 安装/更新依赖...${NC}"
npm install
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

echo -e "${YELLOW}步骤 3/5: 检查数据库连接...${NC}"
# 读取 .env 文件中的数据库配置
if [ -f ".env" ]; then
    source .env
    echo -e "${GREEN}✓ 已加载 .env 配置${NC}"
else
    echo -e "${YELLOW}⚠ 未找到 .env 文件，将使用默认配置${NC}"
fi

# 检查 MySQL 是否运行
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✓ MySQL 客户端已安装${NC}"
    
    # 询问是否应用数据库索引优化
    echo ""
    read -p "是否应用数据库索引优化？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}正在应用数据库索引优化...${NC}"
        
        # 获取数据库配置
        DB_HOST=${DATABASE_HOST:-localhost}
        DB_PORT=${DATABASE_PORT:-3306}
        DB_NAME=${DATABASE_NAME:-ieclub_db}
        DB_USER=${DATABASE_USER:-root}
        
        echo "数据库配置:"
        echo "  主机: $DB_HOST"
        echo "  端口: $DB_PORT"
        echo "  数据库: $DB_NAME"
        echo "  用户: $DB_USER"
        echo ""
        
        read -sp "请输入数据库密码: " DB_PASSWORD
        echo ""
        
        # 执行索引优化脚本
        if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < scripts/optimize-database-indexes.sql; then
            echo -e "${GREEN}✓ 数据库索引优化完成${NC}"
        else
            echo -e "${RED}✗ 数据库索引优化失败${NC}"
            echo -e "${YELLOW}  请手动执行: mysql -u $DB_USER -p $DB_NAME < scripts/optimize-database-indexes.sql${NC}"
        fi
    else
        echo -e "${YELLOW}⊘ 跳过数据库索引优化${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 未安装 MySQL 客户端，跳过数据库索引优化${NC}"
    echo -e "${YELLOW}  请手动执行: mysql -u root -p ieclub_db < scripts/optimize-database-indexes.sql${NC}"
fi
echo ""

echo -e "${YELLOW}步骤 4/5: 检查配置文件...${NC}"

# 检查必需的环境变量
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "SESSION_SECRET"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠ 缺少以下环境变量:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo -e "${YELLOW}  请在 .env 文件中配置这些变量${NC}"
else
    echo -e "${GREEN}✓ 所有必需的环境变量已配置${NC}"
fi
echo ""

echo -e "${YELLOW}步骤 5/5: 验证优化文件...${NC}"

# 检查优化文件是否存在
OPTIMIZATION_FILES=(
    "src/utils/common.js"
    "src/utils/errorHandler.js"
    "src/utils/queryTimeout.js"
    "src/utils/performanceMonitor.js"
    "src/middleware/requestLogger.js"
    "src/controllers/BaseController.js"
    "scripts/optimize-database-indexes.sql"
)

MISSING_FILES=()
for file in "${OPTIMIZATION_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}✗ 缺少以下优化文件:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
    echo -e "${RED}  请确保所有优化文件都已正确创建${NC}"
    exit 1
else
    echo -e "${GREEN}✓ 所有优化文件已就绪${NC}"
fi
echo ""

echo "========================================="
echo -e "${GREEN}  优化应用完成！${NC}"
echo "========================================="
echo ""
echo "优化内容:"
echo "  ✓ 通用工具函数库"
echo "  ✓ 统一错误处理"
echo "  ✓ 查询超时控制"
echo "  ✓ 性能监控工具"
echo "  ✓ 请求日志中间件"
echo "  ✓ 控制器基类"
echo "  ✓ 速率限制"
echo "  ✓ 数据库索引优化（如已应用）"
echo ""
echo "下一步:"
echo "  1. 启动服务: npm start"
echo "  2. 查看性能报告: curl http://localhost:3000/performance"
echo "  3. 查看 API 文档: curl http://localhost:3000/api/docs"
echo "  4. 阅读优化文档: cat README_OPTIMIZATION.md"
echo ""
echo "监控端点:"
echo "  - GET /health - 健康检查"
echo "  - GET /performance - 性能报告（开发环境）"
echo "  - GET /api/test - API 测试"
echo "  - GET /api/docs - API 文档"
echo ""
echo -e "${GREEN}祝您使用愉快！${NC}"
echo ""

