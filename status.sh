#!/bin/bash

# 个人记账系统 - 查看服务状态

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/pids"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  服务状态检查${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# 检查MongoDB
echo -e "${YELLOW}数据库服务:${NC}"
if systemctl is-active --quiet mongod 2>/dev/null || pgrep -x mongod > /dev/null; then
    echo -e "  ${GREEN}✓${NC} MongoDB      - 运行中"
else
    echo -e "  ${RED}✗${NC} MongoDB      - 未运行"
fi

if systemctl is-active --quiet redis 2>/dev/null || pgrep -x redis-server > /dev/null; then
    echo -e "  ${GREEN}✓${NC} Redis        - 运行中"
else
    echo -e "  ${RED}✗${NC} Redis        - 未运行"
fi

echo ""
echo -e "${YELLOW}后端服务:${NC}"

# 定义服务和端口
declare -A SERVICES
SERVICES["user-service"]="3000"
SERVICES["account-service"]="3001"
SERVICES["transaction-service"]="3002"
SERVICES["budget-service"]="3003"
SERVICES["report-service"]="3004"
SERVICES["quote-service"]="3005"

# 检查每个服务
for service in "${!SERVICES[@]}"; do
    port=${SERVICES[$service]}
    PID_FILE="$PID_DIR/$service.pid"
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            # 检查端口是否监听
            if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
                echo -e "  ${GREEN}✓${NC} $service (PID: $PID, 端口: $port)"
            else
                echo -e "  ${YELLOW}!${NC} $service (PID: $PID) - 端口 $port 未监听"
            fi
        else
            echo -e "  ${RED}✗${NC} $service - PID文件存在但进程未运行"
        fi
    else
        echo -e "  ${RED}✗${NC} $service - 未运行 (无PID文件)"
    fi
done

echo ""
echo -e "${YELLOW}端口监听:${NC}"
for port in 3000 3001 3002 3003 3004 3005; do
    if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "  ${GREEN}✓${NC} 端口 $port - 已监听"
    else
        echo -e "  ${RED}✗${NC} 端口 $port - 未监听"
    fi
done

echo ""
