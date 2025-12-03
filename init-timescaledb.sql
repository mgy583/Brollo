-- 启用 TimescaleDB 扩展
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 5.1 账户余额历史表
CREATE TABLE IF NOT EXISTS account_balance_history (
    time TIMESTAMPTZ NOT NULL,
    account_id UUID NOT NULL,
    balance NUMERIC(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    snapshot_type VARCHAR(20) NOT NULL, -- auto/manual
    PRIMARY KEY (account_id, time)
);

-- 转换为超表
SELECT create_hypertable('account_balance_history', 'time', if_not_exists => TRUE);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_balance_history_account ON account_balance_history (account_id, time DESC);

-- 数据保留策略 (保留2年)
SELECT add_retention_policy('account_balance_history', INTERVAL '2 years', if_not_exists => TRUE);

-- 5.2 汇率历史表
CREATE TABLE IF NOT EXISTS exchange_rate_history (
    time TIMESTAMPTZ NOT NULL,
    base_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate NUMERIC(19, 8) NOT NULL,
    source VARCHAR(50) NOT NULL,
    PRIMARY KEY (base_currency, target_currency, time)
);

SELECT create_hypertable('exchange_rate_history', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_rate_history_pair ON exchange_rate_history (base_currency, target_currency, time DESC);

SELECT add_retention_policy('exchange_rate_history', INTERVAL '1 year', if_not_exists => TRUE);

-- 5.3 预算执行历史表
CREATE TABLE IF NOT EXISTS budget_execution_history (
    time TIMESTAMPTZ NOT NULL,
    budget_id UUID NOT NULL,
    spent NUMERIC(19, 4) NOT NULL,
    remaining NUMERIC(19, 4) NOT NULL,
    progress NUMERIC(5, 2) NOT NULL,
    PRIMARY KEY (budget_id, time)
);

SELECT create_hypertable('budget_execution_history', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_budget_history ON budget_execution_history (budget_id, time DESC);

SELECT add_retention_policy('budget_execution_history', INTERVAL '2 years', if_not_exists => TRUE);
