#!/bin/bash

# 启动所有后端服务（开发模式）

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  启动后端服务 (开发模式)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"

# 启动所有服务（调试模式）
echo -e "${YELLOW}启动 user-service...${NC}"
cargo run --bin user-service > "$LOG_DIR/user-service.log" 2>&1 &

echo -e "${YELLOW}启动 account-service...${NC}"
cargo run --bin account-service > "$LOG_DIR/account-service.log" 2>&1 &

echo -e "${YELLOW}启动 transaction-service...${NC}"
cargo run --bin transaction-service > "$LOG_DIR/transaction-service.log" 2>&1 &

echo -e "${YELLOW}启动 budget-service...${NC}"
cargo run --bin budget-service > "$LOG_DIR/budget-service.log" 2>&1 &

echo -e "${YELLOW}启动 report-service...${NC}"
cargo run --bin report-service > "$LOG_DIR/report-service.log" 2>&1 &

echo -e "${YELLOW}启动 quote-service...${NC}"
cargo run --bin quote-service > "$LOG_DIR/quote-service.log" 2>&1 &

echo ""
echo -e "${GREEN}✓ 所有服务已启动 (开发模式)${NC}"
echo -e "${YELLOW}日志目录: $LOG_DIR${NC}"
echo ""
