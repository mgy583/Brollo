#!/bin/bash

# 启动前端生产服务器（使用nginx或serve）

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  启动前端生产服务器${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}未找到构建文件，开始构建...${NC}"
    npm run build
fi

# 尝试使用 serve
if command -v serve &> /dev/null; then
    echo -e "${GREEN}使用 serve 启动...${NC}"
    serve -s dist -l 5173
elif command -v npx &> /dev/null; then
    echo -e "${GREEN}使用 npx serve 启动...${NC}"
    npx serve -s dist -l 5173
else
    echo -e "${RED}请安装 serve: npm install -g serve${NC}"
    echo -e "${YELLOW}或配置 nginx 服务器${NC}"
    exit 1
fi
