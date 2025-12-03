#!/bin/bash

# Docker 重新构建脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  重新构建 Docker 镜像${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${YELLOW}[1/3] 停止容器...${NC}"
docker-compose down || docker compose down

echo -e "${YELLOW}[2/3] 重新构建镜像（无缓存）...${NC}"
docker-compose build --no-cache || docker compose build --no-cache

echo -e "${YELLOW}[3/3] 启动服务...${NC}"
docker-compose up -d || docker compose up -d

echo ""
echo -e "${GREEN}✓ 重新构建完成！${NC}"
echo ""
