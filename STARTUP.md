# ABook 项目启动指南

## 快速启动（前端开发模式）

由于 Docker 网络问题，这里提供本地开发启动方式：

### 1. 启动前端（先体验界面）

```powershell
# 进入前端目录
cd e:\workspace\abook\frontend

# 安装依赖（首次需要，约2-3分钟）
npm install

# 启动开发服务器
npm run dev
```

启动后访问: http://localhost:5173

### 2. 启动后端服务（需要数据库）

由于目前 Docker 网络问题，后端启动需要：

**选项 A: 修复 Docker Desktop**
1. 打开 Docker Desktop
2. 确保 Docker Engine 正在运行
3. 设置 -> Docker Engine -> 添加镜像加速器

**选项 B: 使用本地数据库**
1. 安装 MongoDB 本地版
2. 安装 Redis 本地版
3. 设置环境变量后启动服务

### 3. 快速测试编译

```powershell
# 测试后端能否编译
cd e:\workspace\abook\backend
cargo check

# 测试前端能否构建
cd e:\workspace\abook\frontend
npm run build
```

## 完整生产环境启动

当 Docker 网络正常后：

```powershell
cd e:\workspace\abook

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down
```

## 服务端口

- 前端: http://localhost (生产) / http://localhost:5173 (开发)
- 用户服务: http://localhost:3000
- 账户服务: http://localhost:3001
- 交易服务: http://localhost:3002
- 预算服务: http://localhost:3003
- 报表服务: http://localhost:3004
- 汇率服务: http://localhost:3005
- MongoDB: localhost:27017
- Redis: localhost:6379

## 常见问题

**Q: Docker 网络超时？**
A: 配置 Docker 镜像加速器或使用本地开发模式

**Q: Rust 编译慢？**
A: 首次编译需要下载依赖，约5-10分钟，之后会很快

**Q: npm install 慢？**
A: 使用国内镜像: `npm config set registry https://registry.npmmirror.com`
