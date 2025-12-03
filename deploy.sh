#!/bin/bash

# 个人记账系统 - 部署脚本
# 用于生产环境部署

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  个人记账系统 - 部署${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查必要工具
echo -e "${YELLOW}[1/5] 检查环境...${NC}"
command -v cargo >/dev/null 2>&1 || { echo -e "${RED}✗ 需要安装 Rust${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}✗ 需要安装 Node.js${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}✗ 需要安装 npm${NC}"; exit 1; }
echo -e "${GREEN}✓ 环境检查通过${NC}"

# 停止现有服务
echo -e "${YELLOW}[2/5] 停止现有服务...${NC}"
if [ -f "$SCRIPT_DIR/stop-all.sh" ]; then
    "$SCRIPT_DIR/stop-all.sh" 2>/dev/null || true
fi
echo -e "${GREEN}✓ 服务已停止${NC}"

# 编译项目
echo -e "${YELLOW}[3/5] 编译项目...${NC}"
"$SCRIPT_DIR/build.sh"

# 配置环境变量
echo -e "${YELLOW}[4/5] 配置环境变量...${NC}"
cat > "$SCRIPT_DIR/.env" << EOF
# 数据库配置
MONGO_URI=mongodb://localhost:27017
REDIS_URI=redis://localhost:6379

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=86400

# 服务端口
USER_SERVICE_PORT=3000
ACCOUNT_SERVICE_PORT=3001
TRANSACTION_SERVICE_PORT=3002
BUDGET_SERVICE_PORT=3003
REPORT_SERVICE_PORT=3004
QUOTE_SERVICE_PORT=3005

# 日志级别
RUST_LOG=info
EOF
echo -e "${GREEN}✓ 环境变量已配置${NC}"

# 启动服务
echo -e "${YELLOW}[5/5] 启动服务...${NC}"
"$SCRIPT_DIR/start-all.sh"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}访问地址:${NC}"
echo "  前端: http://localhost:5173"
echo "  后端API: http://localhost:3000-3005"
echo ""
echo -e "${YELLOW}管理命令:${NC}"
echo "  查看状态: ./status.sh"
echo "  停止服务: ./stop-all.sh"
echo "  重启服务: ./restart-all.sh"
echo "  查看日志: tail -f logs/*.log"
echo ""
