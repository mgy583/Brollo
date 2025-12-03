#!/bin/bash

# 个人记账系统 - 重启所有服务

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "正在停止所有服务..."
"$SCRIPT_DIR/stop-all.sh"

echo ""
echo "等待2秒..."
sleep 2

echo ""
echo "正在启动所有服务..."
"$SCRIPT_DIR/start-all.sh"
