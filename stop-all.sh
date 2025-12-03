#!/bin/bash

# 个人记账系统 - 停止所有服务

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/pids"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  停止所有服务${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# 定义服务列表
SERVICES=(
    "user-service"
    "account-service"
    "transaction-service"
    "budget-service"
    "report-service"
    "quote-service"
)

# 停止每个服务
for service in "${SERVICES[@]}"; do
    PID_FILE="$PID_DIR/$service.pid"
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}停止 $service (PID: $PID)...${NC}"
            kill $PID
            sleep 1
            
            # 如果进程还在运行，强制kill
            if ps -p $PID > /dev/null 2>&1; then
                echo -e "${YELLOW}强制停止 $service...${NC}"
                kill -9 $PID
            fi
            
            echo -e "${GREEN}✓ $service 已停止${NC}"
        else
            echo -e "${YELLOW}! $service (PID: $PID) 未运行${NC}"
        fi
        rm -f "$PID_FILE"
    else
        echo -e "${YELLOW}! $service 无PID文件${NC}"
    fi
done

# 清理可能遗留的进程
echo ""
echo -e "${YELLOW}清理遗留进程...${NC}"
pkill -f "user-service" 2>/dev/null
pkill -f "account-service" 2>/dev/null
pkill -f "transaction-service" 2>/dev/null
pkill -f "budget-service" 2>/dev/null
pkill -f "report-service" 2>/dev/null
pkill -f "quote-service" 2>/dev/null

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 所有服务已停止${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
