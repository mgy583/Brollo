#!/bin/bash

# 安装系统依赖
# 适用于 Ubuntu/Debian 系统

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  安装系统依赖${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 更新包列表
echo -e "${YELLOW}[1/6] 更新包列表...${NC}"
apt-get update

# 安装基础工具
echo -e "${YELLOW}[2/6] 安装基础工具...${NC}"
apt-get install -y curl wget git build-essential pkg-config libssl-dev

# 安装 MongoDB
echo -e "${YELLOW}[3/6] 安装 MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -sc)/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    echo -e "${GREEN}✓ MongoDB 已安装${NC}"
else
    echo -e "${GREEN}✓ MongoDB 已存在${NC}"
fi

# 安装 Redis
echo -e "${YELLOW}[4/6] 安装 Redis...${NC}"
if ! command -v redis-server &> /dev/null; then
    apt-get install -y redis-server
    systemctl start redis
    systemctl enable redis
    echo -e "${GREEN}✓ Redis 已安装${NC}"
else
    echo -e "${GREEN}✓ Redis 已存在${NC}"
fi

# 安装 Rust
echo -e "${YELLOW}[5/6] 安装 Rust...${NC}"
if ! command -v cargo &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    echo -e "${GREEN}✓ Rust 已安装${NC}"
else
    echo -e "${GREEN}✓ Rust 已存在${NC}"
fi

# 安装 Node.js
echo -e "${YELLOW}[6/6] 安装 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js 已安装${NC}"
else
    echo -e "${GREEN}✓ Node.js 已存在${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 所有依赖安装完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}版本信息:${NC}"
echo "  Rust:    $(rustc --version 2>/dev/null || echo '未安装')"
echo "  Cargo:   $(cargo --version 2>/dev/null || echo '未安装')"
echo "  Node.js: $(node --version 2>/dev/null || echo '未安装')"
echo "  npm:     $(npm --version 2>/dev/null || echo '未安装')"
echo "  MongoDB: $(mongod --version 2>/dev/null | head -n1 || echo '未安装')"
echo "  Redis:   $(redis-server --version 2>/dev/null || echo '未安装')"
echo ""
