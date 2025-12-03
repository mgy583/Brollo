# Bash 脚本使用说明

## 在 Linux/Mac 上使用前，需要添加执行权限：

```bash
# 主脚本
chmod +x start-all.sh
chmod +x stop-all.sh
chmod +x restart-all.sh
chmod +x status.sh
chmod +x build.sh
chmod +x deploy.sh
chmod +x install-deps.sh

# 后端脚本
chmod +x backend/start-backend.sh

# 前端脚本
chmod +x frontend/start-frontend.sh
chmod +x frontend/start-frontend-prod.sh

# systemd 脚本
chmod +x systemd/install-services.sh
```

## 快速部署命令：

```bash
# 1. 安装依赖（需要 sudo）
sudo ./install-deps.sh

# 2. 编译项目
./build.sh

# 3. 部署并启动
./deploy.sh

# 4. 查看状态
./status.sh
```

## 日常管理：

```bash
# 启动服务
./start-all.sh

# 停止服务
./stop-all.sh

# 重启服务
./restart-all.sh

# 查看状态
./status.sh

# 查看日志
tail -f logs/*.log
```

## 使用 systemd（生产环境推荐）：

```bash
# 1. 编辑服务文件，修改用户和路径
nano systemd/abook-user.service

# 2. 安装服务
sudo ./systemd/install-services.sh

# 3. 管理服务
sudo systemctl status abook-user
sudo systemctl restart abook-user
sudo journalctl -u abook-user -f
```

## 使用 Nginx（生产环境）：

```bash
# 1. 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/abook

# 2. 修改配置
sudo nano /etc/nginx/sites-available/abook
# - 修改 server_name
# - 修改前端文件路径

# 3. 启用配置
sudo ln -s /etc/nginx/sites-available/abook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

详细文档请查看: DEPLOYMENT.md
