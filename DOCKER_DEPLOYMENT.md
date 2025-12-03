# Docker 部署文档

## 目录

1. [快速开始](#快速开始)
2. [环境要求](#环境要求)
3. [配置说明](#配置说明)
4. [部署步骤](#部署步骤)
5. [管理命令](#管理命令)
6. [故障排查](#故障排查)
7. [生产环境配置](#生产环境配置)

---

## 快速开始

### 一键部署

```bash
# Linux/Mac
chmod +x docker-start.sh
./docker-start.sh

# Windows (PowerShell)
docker-compose up -d
```

访问 http://localhost 即可使用系统。

---

## 环境要求

### 必需软件
- Docker: 20.10 或更高版本
- Docker Compose: 2.0 或更高版本

### 系统资源
- CPU: 2核心及以上
- 内存: 4GB 及以上
- 磁盘: 10GB 可用空间

### 安装 Docker

#### Ubuntu/Debian
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### CentOS/RHEL
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

#### macOS
下载并安装 [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)

#### Windows
下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

---

## 配置说明

### docker-compose.yml

主要配置文件，定义了所有服务：

- **mongodb**: MongoDB 7.0 数据库
- **redis**: Redis 7 缓存
- **user-service**: 用户服务（端口 3000）
- **account-service**: 账户服务（端口 3001）
- **transaction-service**: 交易服务（端口 3002）
- **budget-service**: 预算服务（端口 3003）
- **report-service**: 报表服务（端口 3004）
- **quote-service**: 汇率服务（端口 3005）
- **frontend**: 前端界面（端口 80）

### 环境变量配置

编辑 `docker-compose.yml` 中的环境变量：

```yaml
environment:
  MONGO_URI: mongodb://admin:admin123@mongodb:27017/abook?authSource=admin
  REDIS_URI: redis://redis:6379
  JWT_SECRET: your-super-secret-jwt-key-change-in-production  # 修改此值！
  RUST_LOG: info
```

**重要**: 生产环境请务必修改：
- MongoDB 密码（MONGO_INITDB_ROOT_PASSWORD）
- JWT 密钥（JWT_SECRET）

---

## 部署步骤

### 方法一: 使用启动脚本（推荐）

```bash
# 1. 添加执行权限
chmod +x docker-start.sh docker-stop.sh docker-logs.sh docker-rebuild.sh

# 2. 启动服务
./docker-start.sh

# 3. 查看日志
./docker-logs.sh

# 4. 停止服务
./docker-stop.sh
```

### 方法二: 使用 docker-compose 命令

```bash
# 构建并启动
docker-compose up -d --build

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

### 方法三: Windows PowerShell

```powershell
# 启动服务
docker-compose up -d --build

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 管理命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart user-service

# 查看服务状态
docker-compose ps

# 查看资源使用
docker stats
```

### 日志管理

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f user-service

# 查看最近100条日志
docker-compose logs --tail=100 user-service

# 导出日志
docker-compose logs > logs.txt
```

### 数据管理

```bash
# 进入 MongoDB 容器
docker exec -it abook-mongodb mongosh -u admin -p admin123

# MongoDB 操作
use abook
show collections
db.users.find()

# 进入 Redis 容器
docker exec -it abook-redis redis-cli

# Redis 操作
KEYS *
GET key_name
```

### 镜像管理

```bash
# 查看镜像
docker images

# 删除未使用的镜像
docker image prune -a

# 重新构建镜像
./docker-rebuild.sh

# 或
docker-compose build --no-cache
```

### 数据备份

```bash
# 备份 MongoDB
docker exec abook-mongodb mongodump \
  --uri="mongodb://admin:admin123@localhost:27017/abook?authSource=admin" \
  --out=/backup

docker cp abook-mongodb:/backup ./backup-$(date +%Y%m%d)

# 备份 Redis
docker exec abook-redis redis-cli --rdb /data/dump.rdb
docker cp abook-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb

# 恢复 MongoDB
docker cp ./backup-20231203 abook-mongodb:/backup
docker exec abook-mongodb mongorestore \
  --uri="mongodb://admin:admin123@localhost:27017/abook?authSource=admin" \
  /backup
```

---

## 故障排查

### 服务无法启动

1. **检查端口占用**
```bash
# Linux/Mac
netstat -tuln | grep -E "80|3000|3001|3002|3003|3004|3005|27017|6379"

# Windows
netstat -ano | findstr "80 3000 3001 3002 3003 3004 3005 27017 6379"
```

2. **查看容器日志**
```bash
docker-compose logs user-service
docker-compose logs mongodb
```

3. **检查容器状态**
```bash
docker-compose ps
docker inspect abook-user-service
```

### 数据库连接失败

1. **检查 MongoDB 健康状态**
```bash
docker exec abook-mongodb mongosh --eval "db.adminCommand('ping')"
```

2. **检查 Redis 连接**
```bash
docker exec abook-redis redis-cli ping
```

3. **验证网络连接**
```bash
docker network ls
docker network inspect abook_abook-network
```

### 前端无法访问后端

1. **检查 Nginx 配置**
```bash
docker exec abook-frontend nginx -t
docker exec abook-frontend cat /etc/nginx/conf.d/default.conf
```

2. **验证服务可达性**
```bash
docker exec abook-frontend curl http://user-service:3000/health
```

### 内存不足

1. **查看资源使用**
```bash
docker stats
```

2. **限制容器资源**
编辑 `docker-compose.yml`：
```yaml
services:
  user-service:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### 磁盘空间不足

```bash
# 清理未使用的容器
docker container prune

# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 完全清理
docker system prune -a --volumes
```

---

## 生产环境配置

### 使用环境变量文件

创建 `.env` 文件：
```env
# MongoDB
MONGO_ROOT_PASSWORD=your-strong-password-here
MONGO_DATABASE=abook

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRATION=86400

# 日志级别
RUST_LOG=warn
```

修改 `docker-compose.yml` 使用环境变量：
```yaml
environment:
  MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
  JWT_SECRET: ${JWT_SECRET}
```

### 使用外部数据库

如果使用外部 MongoDB/Redis，移除 docker-compose.yml 中的数据库服务，修改连接字符串：

```yaml
environment:
  MONGO_URI: mongodb://user:pass@external-mongodb:27017/abook
  REDIS_URI: redis://external-redis:6379
```

### HTTPS 配置

使用 Traefik 或 Nginx Proxy Manager：

```yaml
# 添加 labels
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.abook.rule=Host(`abook.yourdomain.com`)"
  - "traefik.http.routers.abook.tls=true"
  - "traefik.http.routers.abook.tls.certresolver=letsencrypt"
```

### 持久化存储

确保数据卷配置正确：

```yaml
volumes:
  mongodb_data:
    driver: local
    driver_opts:
      type: none
      device: /data/mongodb
      o: bind
```

### 监控和日志

添加监控服务（可选）：

```yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 自动重启策略

```yaml
services:
  user-service:
    restart: unless-stopped  # 或 always
```

### 健康检查

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## 性能优化

### 构建优化

1. **使用多阶段构建**（已实现）
2. **缓存层优化**
```dockerfile
# 先复制 Cargo.toml 构建依赖
COPY Cargo.toml ./
RUN cargo build --release
# 再复制源代码
COPY src ./src
```

### 运行时优化

1. **资源限制**
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

2. **使用 Alpine 镜像**
```dockerfile
FROM rust:1.75-alpine as builder
FROM alpine:3.18
```

---

## 安全建议

1. **不要在生产环境使用默认密码**
2. **使用 Docker secrets 管理敏感信息**
3. **定期更新镜像**
4. **使用非 root 用户运行容器**（已实现）
5. **配置防火墙限制访问**
6. **启用容器安全扫描**

```bash
# 扫描镜像安全漏洞
docker scan abook-user-service
```

---

## 常用 Docker Compose 命令速查

| 命令 | 说明 |
|------|------|
| `docker-compose up -d` | 后台启动服务 |
| `docker-compose down` | 停止并删除容器 |
| `docker-compose ps` | 查看服务状态 |
| `docker-compose logs -f` | 实时查看日志 |
| `docker-compose restart` | 重启服务 |
| `docker-compose exec SERVICE sh` | 进入容器 |
| `docker-compose build` | 构建镜像 |
| `docker-compose pull` | 拉取最新镜像 |
| `docker-compose config` | 验证配置文件 |

---

## 联系支持

遇到问题请查看：
- [README.md](README.md) - 项目文档
- [DEPLOYMENT.md](DEPLOYMENT.md) - 传统部署方式
- GitHub Issues - 问题追踪
