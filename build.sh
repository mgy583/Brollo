#!/bin/bash

# 个人记账系统 - 编译脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  编译个人记账系统${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 编译后端
echo -e "${YELLOW}[1/2] 编译后端服务...${NC}"
cd "$SCRIPT_DIR/backend"

echo "编译模式: Release"
cargo build --release

echo -e "${GREEN}✓ 后端编译完成${NC}"
echo ""

# 编译前端
echo -e "${YELLOW}[2/2] 编译前端...${NC}"
cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

echo "构建生产版本..."
npm run build

echo -e "${GREEN}✓ 前端构建完成${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 编译完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}后端二进制文件:${NC} $SCRIPT_DIR/backend/target/release/"
echo -e "${YELLOW}前端构建文件:${NC} $SCRIPT_DIR/frontend/dist/"
echo ""
