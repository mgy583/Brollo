# 多阶段构建 Dockerfile for 后端服务

# 阶段 1: 构建
FROM rust:latest as builder

# 安装 nightly toolchain 以支持 edition2024
RUN rustup default nightly

# 安装依赖
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# 创建工作目录
WORKDIR /app

# 复制 Cargo 文件
COPY Cargo.toml ./
COPY common/Cargo.toml ./common/
COPY services/user-service/Cargo.toml ./services/user-service/
COPY services/account-service/Cargo.toml ./services/account-service/
COPY services/transaction-service/Cargo.toml ./services/transaction-service/
COPY services/budget-service/Cargo.toml ./services/budget-service/
COPY services/report-service/Cargo.toml ./services/report-service/
COPY services/quote-service/Cargo.toml ./services/quote-service/

# 创建虚拟源文件以缓存依赖
RUN mkdir -p common/src && echo "fn main() {}" > common/src/lib.rs && \
    mkdir -p services/user-service/src && echo "fn main() {}" > services/user-service/src/main.rs && \
    mkdir -p services/account-service/src && echo "fn main() {}" > services/account-service/src/main.rs && \
    mkdir -p services/transaction-service/src && echo "fn main() {}" > services/transaction-service/src/main.rs && \
    mkdir -p services/budget-service/src && echo "fn main() {}" > services/budget-service/src/main.rs && \
    mkdir -p services/report-service/src && echo "fn main() {}" > services/report-service/src/main.rs && \
    mkdir -p services/quote-service/src && echo "fn main() {}" > services/quote-service/src/main.rs

# 构建依赖（缓存层）
RUN cargo build --release

# 删除虚拟源文件
RUN rm -rf common/src services/*/src

# 复制实际源代码
COPY common/src ./common/src
COPY services ./services

# 重新构建（只编译源代码）
RUN touch common/src/lib.rs && \
    find services -name "main.rs" -exec touch {} \; && \
    cargo build --release

# 阶段 2: 运行时
FROM debian:bookworm-slim

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN useradd -m -u 1000 appuser

WORKDIR /app

# 复制编译好的二进制文件
ARG SERVICE_NAME
COPY --from=builder /app/target/release/${SERVICE_NAME} /app/service

# 切换到非 root 用户
USER appuser

# 暴露端口（将在 docker-compose 中指定具体端口）
EXPOSE 3000

# 启动服务
CMD ["/app/service"]
