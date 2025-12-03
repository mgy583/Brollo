#!/bin/bash

# Docker Compose 日志查看脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SERVICE=$1

if [ -z "$SERVICE" ]; then
    echo "查看所有服务日志..."
    docker-compose logs -f --tail=100 || docker compose logs -f --tail=100
else
    echo "查看 $SERVICE 服务日志..."
    docker-compose logs -f --tail=100 "$SERVICE" || docker compose logs -f --tail=100 "$SERVICE"
fi
