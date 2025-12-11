use mongodb::{Client, Database};
use redis::aio::ConnectionManager;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tracing::warn;

#[derive(Clone)]
pub struct DatabaseConnection {
    pub mongo: Arc<Database>,
    pub redis: Arc<ConnectionManager>,
    pub pg: Option<PgPool>,
}

impl DatabaseConnection {
    pub async fn new(mongo_uri: &str, redis_uri: &str, pg_uri: Option<&str>, db_name: &str) -> Result<Self, Box<dyn std::error::Error>> {
        // Try to connect to Mongo with retries
        let mut attempts = 0u32;
        let mongo = loop {
            match Client::with_uri_str(mongo_uri).await {
                Ok(client) => break Arc::new(client.database(db_name)),
                Err(e) => {
                    attempts += 1;
                    if attempts >= 10 {
                        return Err(Box::new(e));
                    }
                    warn!("Failed to connect to Mongo (attempt {}), retrying...: {}", attempts, e);
                    sleep(Duration::from_secs(2u64.pow(attempts.min(6)))).await;
                }
            }
        };

        // Redis connection with retries
        attempts = 0;
        let redis = loop {
            match redis::Client::open(redis_uri) {
                Ok(client) => match ConnectionManager::new(client).await {
                    Ok(conn) => break Arc::new(conn),
                    Err(e) => {
                        attempts += 1;
                        if attempts >= 10 {
                            return Err(Box::new(e));
                        }
                        warn!("Failed to create Redis connection (attempt {}), retrying...: {}", attempts, e);
                        sleep(Duration::from_secs(2u64.pow(attempts.min(6)))).await;
                    }
                },
                Err(e) => {
                    attempts += 1;
                    if attempts >= 10 {
                        return Err(Box::new(e));
                    }
                    warn!("Failed to open Redis client (attempt {}), retrying...: {}", attempts, e);
                    sleep(Duration::from_secs(2u64.pow(attempts.min(6)))).await;
                }
            }
        };

        // Optional Postgres (TimescaleDB) connection with retries
        let pg = if let Some(uri) = pg_uri {
            attempts = 0;
            loop {
                match PgPoolOptions::new().max_connections(5).connect(uri).await {
                    Ok(pool) => break Some(pool),
                    Err(e) => {
                        attempts += 1;
                        if attempts >= 10 {
                            return Err(Box::new(e));
                        }
                        warn!("Failed to connect to Postgres (attempt {}), retrying...: {}", attempts, e);
                        sleep(Duration::from_secs(2u64.pow(attempts.min(6)))).await;
                    }
                }
            }
        } else {
            None
        };

        Ok(Self { mongo, redis, pg })
    }
}
