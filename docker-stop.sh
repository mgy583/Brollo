#!/bin/bash

# Docker Compose 停止脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  停止所有 Docker 服务${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

echo -e "${YELLOW}停止容器...${NC}"
docker-compose down || docker compose down

echo ""
echo -e "${GREEN}✓ 所有服务已停止${NC}"
echo ""
