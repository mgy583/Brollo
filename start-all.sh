#!/bin/bash

# 个人记账系统 - 一键启动脚本
# 用于服务器部署环境

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/pids"

# 创建日志和PID目录
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  个人记账系统 - 启动所有服务${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查MongoDB
echo -e "${YELLOW}[1/8] 检查 MongoDB...${NC}"
if systemctl is-active --quiet mongod 2>/dev/null || pgrep -x mongod > /dev/null; then
    echo -e "${GREEN}✓ MongoDB 运行中${NC}"
else
    echo -e "${YELLOW}! MongoDB 未运行，尝试启动...${NC}"
    if command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
    else
        echo -e "${RED}✗ 请手动启动 MongoDB${NC}"
        exit 1
    fi
fi

# 检查Redis
echo -e "${YELLOW}[2/8] 检查 Redis...${NC}"
if systemctl is-active --quiet redis 2>/dev/null || pgrep -x redis-server > /dev/null; then
    echo -e "${GREEN}✓ Redis 运行中${NC}"
else
    echo -e "${YELLOW}! Redis 未运行，尝试启动...${NC}"
    if command -v systemctl &> /dev/null; then
        sudo systemctl start redis
    else
        echo -e "${RED}✗ 请手动启动 Redis${NC}"
        exit 1
    fi
fi

# 启动后端服务
cd "$SCRIPT_DIR/backend"

echo -e "${YELLOW}[3/8] 启动 user-service (端口3000)...${NC}"
nohup ./target/release/user-service > "$LOG_DIR/user-service.log" 2>&1 &
echo $! > "$PID_DIR/user-service.pid"
echo -e "${GREEN}✓ user-service 已启动 (PID: $(cat $PID_DIR/user-service.pid))${NC}"

sleep 1

echo -e "${YELLOW}[4/8] 启动 account-service (端口3001)...${NC}"
nohup ./target/release/account-service > "$LOG_DIR/account-service.log" 2>&1 &
echo $! > "$PID_DIR/account-service.pid"
echo -e "${GREEN}✓ account-service 已启动 (PID: $(cat $PID_DIR/account-service.pid))${NC}"

sleep 1

echo -e "${YELLOW}[5/8] 启动 transaction-service (端口3002)...${NC}"
nohup ./target/release/transaction-service > "$LOG_DIR/transaction-service.log" 2>&1 &
echo $! > "$PID_DIR/transaction-service.pid"
echo -e "${GREEN}✓ transaction-service 已启动 (PID: $(cat $PID_DIR/transaction-service.pid))${NC}"

sleep 1

echo -e "${YELLOW}[6/8] 启动 budget-service (端口3003)...${NC}"
nohup ./target/release/budget-service > "$LOG_DIR/budget-service.log" 2>&1 &
echo $! > "$PID_DIR/budget-service.pid"
echo -e "${GREEN}✓ budget-service 已启动 (PID: $(cat $PID_DIR/budget-service.pid))${NC}"

sleep 1

echo -e "${YELLOW}[7/8] 启动 report-service (端口3004)...${NC}"
nohup ./target/release/report-service > "$LOG_DIR/report-service.log" 2>&1 &
echo $! > "$PID_DIR/report-service.pid"
echo -e "${GREEN}✓ report-service 已启动 (PID: $(cat $PID_DIR/report-service.pid))${NC}"

sleep 1

echo -e "${YELLOW}[8/8] 启动 quote-service (端口3005)...${NC}"
nohup ./target/release/quote-service > "$LOG_DIR/quote-service.log" 2>&1 &
echo $! > "$PID_DIR/quote-service.pid"
echo -e "${GREEN}✓ quote-service 已启动 (PID: $(cat $PID_DIR/quote-service.pid))${NC}"

sleep 2

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 所有服务启动完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}服务状态:${NC}"
echo "  • user-service         端口 3000"
echo "  • account-service      端口 3001"
echo "  • transaction-service  端口 3002"
echo "  • budget-service       端口 3003"
echo "  • report-service       端口 3004"
echo "  • quote-service        端口 3005"
echo ""
echo -e "${YELLOW}日志目录:${NC} $LOG_DIR"
echo -e "${YELLOW}PID目录:${NC} $PID_DIR"
echo ""
echo -e "${YELLOW}查看日志:${NC}"
echo "  tail -f $LOG_DIR/user-service.log"
echo ""
echo -e "${YELLOW}停止服务:${NC}"
echo "  ./stop-all.sh"
echo ""
