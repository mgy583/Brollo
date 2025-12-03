#!/bin/bash

# 安装 systemd 服务
# 需要 root 权限

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEMD_DIR="/etc/systemd/system"

echo "========================================"
echo "  安装 systemd 服务"
echo "========================================"
echo ""

# 提示用户配置
echo "请先编辑服务文件，修改以下内容："
echo "  - User=your-user (改为实际用户名)"
echo "  - Group=your-group (改为实际组名)"
echo "  - WorkingDirectory=/path/to/abook/backend (改为实际路径)"
echo "  - ExecStart=/path/to/abook/backend/target/release/xxx (改为实际路径)"
echo ""
read -p "是否已完成配置? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "请先配置服务文件再运行此脚本"
    exit 1
fi

# 复制服务文件
echo "复制服务文件..."
cp "$SCRIPT_DIR/abook-user.service" "$SYSTEMD_DIR/"
cp "$SCRIPT_DIR/abook-account.service" "$SYSTEMD_DIR/"

# 创建其他服务文件（基于 account 模板）
for service in transaction budget report quote; do
    sed "s/Account/${service^}/g; s/account/${service}/g" "$SCRIPT_DIR/abook-account.service" > "$SYSTEMD_DIR/abook-${service}.service"
done

# 重新加载 systemd
echo "重新加载 systemd..."
systemctl daemon-reload

# 启用服务
echo "启用服务..."
systemctl enable abook-user.service
systemctl enable abook-account.service
systemctl enable abook-transaction.service
systemctl enable abook-budget.service
systemctl enable abook-report.service
systemctl enable abook-quote.service

# 启动服务
echo "启动服务..."
systemctl start abook-user.service
systemctl start abook-account.service
systemctl start abook-transaction.service
systemctl start abook-budget.service
systemctl start abook-report.service
systemctl start abook-quote.service

echo ""
echo "========================================"
echo "✓ 所有服务已安装并启动"
echo "========================================"
echo ""
echo "管理命令:"
echo "  查看状态: systemctl status abook-user.service"
echo "  停止服务: systemctl stop abook-user.service"
echo "  启动服务: systemctl start abook-user.service"
echo "  重启服务: systemctl restart abook-user.service"
echo "  查看日志: journalctl -u abook-user.service -f"
echo ""
