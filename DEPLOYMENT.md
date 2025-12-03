# 个人记账系统 - 部署文档

## 目录

1. [系统要求](#系统要求)
2. [快速部署](#快速部署)
3. [详细部署步骤](#详细部署步骤)
4. [生产环境配置](#生产环境配置)
5. [管理命令](#管理命令)
6. [故障排查](#故障排查)

---

## 系统要求

### 硬件要求
- CPU: 2核心及以上
- 内存: 2GB 及以上
- 磁盘: 10GB 可用空间

### 软件要求
- 操作系统: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Rust: 1.75 或更高版本
- Node.js: 18.x 或更高版本
- MongoDB: 7.0 或更高版本
- Redis: 7.0 或更高版本

---

## 快速部署

### 1. 克隆项目
```bash
git clone https://github.com/your-repo/abook.git
cd abook
```

### 2. 安装依赖（Ubuntu/Debian）
```bash
sudo ./install-deps.sh
```

### 3. 编译项目
```bash
./build.sh
```

### 4. 部署并启动
```bash
./deploy.sh
```

### 5. 检查状态
```bash
./status.sh
```

---

## 详细部署步骤

### 步骤 1: 安装系统依赖

#### Ubuntu/Debian
```bash
# 使用安装脚本
sudo ./install-deps.sh

# 或手动安装
sudo apt-get update
sudo apt-get install -y curl wget git build-essential pkg-config libssl-dev

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# 安装 MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -sc)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装 Redis
sudo apt-get install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 步骤 2: 编译项目

```bash
# 编译后端（Release 模式）
cd backend
cargo build --release

# 编译前端
cd ../frontend
npm install
npm run build
```

或使用编译脚本：
```bash
./build.sh
```

### 步骤 3: 配置环境变量

创建 `.env` 文件：
```bash
cat > .env << EOF
# 数据库配置
MONGO_URI=mongodb://localhost:27017
REDIS_URI=redis://localhost:6379

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=86400

# 日志级别
RUST_LOG=info
EOF
```

### 步骤 4: 启动服务

#### 开发环境
```bash
# 启动所有后端服务
./start-all.sh

# 启动前端开发服务器（另一个终端）
cd frontend
./start-frontend.sh
```

#### 生产环境
```bash
# 使用 systemd 服务
sudo ./systemd/install-services.sh

# 或使用 nohup
./start-all.sh
```

---

## 生产环境配置

### 使用 Nginx 反向代理

1. **复制配置文件**
```bash
sudo cp nginx.conf /etc/nginx/sites-available/abook
```

2. **修改配置**
编辑 `/etc/nginx/sites-available/abook`：
- 修改 `server_name` 为你的域名
- 修改 `root` 路径为前端构建文件的实际路径

3. **启用配置**
```bash
sudo ln -s /etc/nginx/sites-available/abook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 使用 systemd 管理服务

1. **配置服务文件**
编辑 `systemd/abook-*.service` 文件：
- 修改 `User` 和 `Group`
- 修改 `WorkingDirectory` 和 `ExecStart` 路径

2. **安装服务**
```bash
sudo ./systemd/install-services.sh
```

3. **管理服务**
```bash
# 查看状态
sudo systemctl status abook-user

# 启动/停止/重启
sudo systemctl start abook-user
sudo systemctl stop abook-user
sudo systemctl restart abook-user

# 查看日志
sudo journalctl -u abook-user -f
```

### SSL/HTTPS 配置

1. **安装 Certbot**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

2. **获取证书**
```bash
sudo certbot --nginx -d your-domain.com
```

3. **自动续期**
```bash
sudo certbot renew --dry-run
```

---

## 管理命令

### 服务管理

```bash
# 启动所有服务
./start-all.sh

# 停止所有服务
./stop-all.sh

# 重启所有服务
./restart-all.sh

# 查看服务状态
./status.sh
```

### 查看日志

```bash
# 查看所有日志
tail -f logs/*.log

# 查看特定服务日志
tail -f logs/user-service.log

# 使用 systemd 日志
sudo journalctl -u abook-user -f
```

### 数据库管理

```bash
# 连接 MongoDB
mongosh

# 查看数据库
show dbs
use abook
show collections

# 备份数据库
mongodump --db abook --out /backup/mongodb/$(date +%Y%m%d)

# 恢复数据库
mongorestore --db abook /backup/mongodb/20231203/abook
```

---

## 故障排查

### 服务无法启动

1. **检查端口占用**
```bash
netstat -tuln | grep -E "3000|3001|3002|3003|3004|3005"
```

2. **检查数据库连接**
```bash
# MongoDB
mongosh --eval "db.version()"

# Redis
redis-cli ping
```

3. **查看详细日志**
```bash
tail -f logs/*.log
```

### 前端无法连接后端

1. **检查代理配置**
查看 `frontend/vite.config.ts` 中的 proxy 配置

2. **检查后端服务状态**
```bash
./status.sh
```

3. **测试 API 连接**
```bash
curl http://localhost:3000/health
```

### 性能问题

1. **检查资源使用**
```bash
# CPU 和内存
top

# 磁盘
df -h

# 网络
netstat -s
```

2. **优化 MongoDB**
```javascript
// 创建索引
use abook
db.users.createIndex({ email: 1 })
db.accounts.createIndex({ user_id: 1 })
db.transactions.createIndex({ user_id: 1, transaction_date: -1 })
```

3. **优化 Redis**
```bash
# 检查内存使用
redis-cli INFO memory

# 清理过期键
redis-cli FLUSHDB
```

---

## 安全建议

1. **更改默认密码和密钥**
   - 修改 `.env` 中的 `JWT_SECRET`
   - 设置 MongoDB 和 Redis 的认证

2. **配置防火墙**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

3. **定期备份**
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
mongodump --db abook --out $BACKUP_DIR/mongodb
cp -r /path/to/abook $BACKUP_DIR/app
EOF

chmod +x backup.sh

# 添加到 crontab（每天凌晨2点备份）
crontab -e
0 2 * * * /path/to/backup.sh
```

4. **监控日志**
```bash
# 使用 logrotate 管理日志
sudo cat > /etc/logrotate.d/abook << EOF
/path/to/abook/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 user group
}
EOF
```

---

## 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 停止服务
./stop-all.sh

# 3. 重新编译
./build.sh

# 4. 启动服务
./start-all.sh

# 或使用一键部署
./deploy.sh
```

---

## 联系支持

如遇到问题，请查看：
- 项目文档: [README.md](README.md)
- 问题追踪: GitHub Issues
- 技术支持: support@example.com
