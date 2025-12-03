#!/bin/bash

# Docker Compose 启动脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  个人记账系统 - Docker 部署${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose 未安装${NC}"
    echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${YELLOW}[1/3] 停止现有容器...${NC}"
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

echo -e "${YELLOW}[2/3] 构建镜像...${NC}"
docker-compose build || docker compose build

echo -e "${YELLOW}[3/3] 启动服务...${NC}"
docker-compose up -d || docker compose up -d

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 服务启动成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}等待服务启动完成...${NC}"
sleep 10

echo ""
echo -e "${YELLOW}服务状态:${NC}"
docker-compose ps || docker compose ps

echo ""
echo -e "${YELLOW}访问地址:${NC}"
echo "  前端: http://localhost"
echo "  用户服务: http://localhost:3000"
echo "  账户服务: http://localhost:3001"
echo "  交易服务: http://localhost:3002"
echo "  预算服务: http://localhost:3003"
echo "  报表服务: http://localhost:3004"
echo "  汇率服务: http://localhost:3005"
echo ""
echo -e "${YELLOW}管理命令:${NC}"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo "  查看状态: docker-compose ps"
echo ""
