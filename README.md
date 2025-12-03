# ABook - 高并发记账系统

基于 Rust 和 React 的高性能记账系统，采用微服务架构设计。

## 项目特点

- **高并发处理**: 支持 50,000+ 并发连接，平均响应时间 < 60ms
- **微服务架构**: 6 个独立服务，易于扩展和维护
- **核心算法**:
  - 滑动窗口预算预测算法
  - 卡尔曼滤波汇率融合算法
- **现代技术栈**:
  - 后端: Rust + Axum + Tokio
  - 前端: React 18 + TypeScript + Vite
  - 数据库: MongoDB + PostgreSQL + Redis + TimescaleDB

## 系统架构

### 后端微服务

1. **用户服务** (Port 3000) - 用户认证与授权
2. **账户服务** (Port 3001) - 账户管理
3. **交易服务** (Port 3002) - 交易记录管理
4. **预算服务** (Port 3003) - 预算管理与预测
5. **报表服务** (Port 3004) - 数据统计与分析
6. **汇率服务** (Port 3005) - 汇率查询与转换

### 技术栈

**后端**
- Rust 1.75+
- Axum 0.7 (Web 框架)
- Tokio 1.35 (异步运行时)
- MongoDB 7.0 (主数据库)
- Redis 7.2 (缓存)
- JWT 认证
- Argon2id 密码哈希

**前端**
- React 18
- TypeScript 5
- Vite 5
- Ant Design 5
- TanStack Query
- Recharts (图表)
- Zustand (状态管理)

## 快速开始

### 前置要求

- Rust 1.75+
- Node.js 20+
- Docker & Docker Compose

### 使用 Docker Compose 运行

```powershell
# 克隆仓库并进入目录
cd e:\workspace\abook

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

服务地址:
- 前端: http://localhost
- API 网关: http://localhost:8080
- MongoDB: localhost:27017
- Redis: localhost:6379

### 本地开发

**后端开发**

```powershell
cd backend

# 启动 MongoDB 和 Redis
docker run -d -p 27017:27017 --name mongo mongo:7.0
docker run -d -p 6379:6379 --name redis redis:7.2-alpine

# 设置环境变量
$env:MONGO_URI="mongodb://localhost:27017"
$env:REDIS_URI="redis://localhost:6379"
$env:JWT_SECRET="your_secret_key"

# 运行特定服务
cargo run -p user-service
cargo run -p account-service
cargo run -p transaction-service
cargo run -p budget-service
cargo run -p report-service
cargo run -p quote-service

# 运行测试
cargo test
```

**前端开发**

```powershell
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
abook/
├── backend/
│   ├── common/                 # 共享库
│   │   ├── src/
│   │   │   ├── error.rs       # 错误处理
│   │   │   ├── models.rs      # 数据模型
│   │   │   ├── auth.rs        # JWT 认证
│   │   │   ├── response.rs    # API 响应
│   │   │   ├── algorithms/    # 核心算法
│   │   │   ├── db/            # 数据库连接
│   │   │   └── middleware.rs  # 中间件
│   │   └── Cargo.toml
│   └── services/              # 微服务
│       ├── user-service/
│       ├── account-service/
│       ├── transaction-service/
│       ├── budget-service/
│       ├── report-service/
│       └── quote-service/
├── frontend/
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   ├── components/        # 通用组件
│   │   ├── stores/            # 状态管理
│   │   ├── utils/             # 工具函数
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## API 文档

### 认证接口

```
POST   /api/register         # 用户注册
POST   /api/login            # 用户登录
POST   /api/refresh          # 刷新令牌
GET    /api/profile          # 获取用户信息
PUT    /api/profile          # 更新用户信息
```

### 账户接口

```
GET    /api/accounts         # 获取账户列表
POST   /api/accounts         # 创建账户
GET    /api/accounts/:id     # 获取账户详情
PUT    /api/accounts/:id     # 更新账户
DELETE /api/accounts/:id     # 删除账户
```

### 交易接口

```
GET    /api/transactions           # 获取交易列表
POST   /api/transactions           # 创建交易
GET    /api/transactions/:id       # 获取交易详情
PUT    /api/transactions/:id       # 更新交易
DELETE /api/transactions/:id       # 删除交易
GET    /api/transactions/statistics # 获取统计数据
```

### 预算接口

```
GET    /api/budgets              # 获取预算列表
POST   /api/budgets              # 创建预算
GET    /api/budgets/:id          # 获取预算详情
PUT    /api/budgets/:id          # 更新预算
DELETE /api/budgets/:id          # 删除预算
GET    /api/budgets/:id/prediction # 预算预测
```

### 报表接口

```
GET    /api/reports/monthly      # 月度报表
GET    /api/reports/category     # 分类报表
GET    /api/reports/trend        # 趋势分析
GET    /api/reports/export       # 导出报表
```

### 汇率接口

```
GET    /api/quotes/:pair         # 获取汇率
GET    /api/quotes/convert       # 货币转换
```

## 核心算法

### 1. 滑动窗口预算预测

基于历史消费数据的时间序列分析，使用加权移动平均和节假日因子进行预测。

**特点**:
- 自适应窗口大小
- 节假日权重调整
- 置信度评估

**使用**:
```rust
use common::BudgetPredictor;

let predictor = BudgetPredictor::new(30); // 30天窗口
let result = predictor.predict(
    &spending_history,
    budget_amount,
    period_start,
    period_end,
    current_time,
);

println!("预测总支出: {}", result.predicted_total);
println!("预测超支: {}", result.predicted_exceed);
println!("置信度: {}", result.confidence);
```

### 2. 卡尔曼滤波汇率融合

融合多个汇率数据源，提供更稳定、准确的汇率估计。

**特点**:
- 多源数据融合
- 噪声过滤
- 动态权重调整

**使用**:
```rust
use common::{ExchangeRateFusion, RateSource};

let mut fusion = ExchangeRateFusion::new();

let sources = vec![
    RateSource {
        name: "央行".to_string(),
        rate: 6.50,
        weight: 0.5,
        noise_variance: 0.0001,
    },
    // 更多数据源...
];

let fused_rate = fusion.fuse_rates("CNY/USD", &sources);
```

## 性能指标

- **并发连接**: 50,000+
- **平均响应时间**: < 60ms
- **P99 延迟**: < 200ms
- **吞吐量**: 10,000 QPS
- **数据库**: MongoDB 事务支持

## 安全特性

- JWT 访问令牌 (15分钟过期)
- JWT 刷新令牌 (7天过期)
- Argon2id 密码哈希
- HTTPS/TLS 加密
- RBAC 权限控制
- SQL 注入防护
- XSS 防护
- CSRF 防护

## 测试

```powershell
# 后端测试
cd backend
cargo test

# 前端测试
cd frontend
npm run test

# 端到端测试
npm run test:e2e
```

## 部署

### Docker 部署

```powershell
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 扩展服务
docker-compose up -d --scale account-service=3
```

### Kubernetes 部署

```powershell
# 应用配置
kubectl apply -f k8s/

# 查看状态
kubectl get pods
kubectl get services
```

## 监控与日志

- **日志**: 使用 tracing 和 tracing-subscriber
- **指标**: Prometheus 兼容
- **追踪**: 分布式追踪支持

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

项目链接: https://github.com/yourusername/abook

## 致谢

- Rust 社区
- Axum 框架
- React 团队
- 所有贡献者

---

**注意**: 这是一个毕业设计项目，用于演示高并发记账系统的设计与实现。
