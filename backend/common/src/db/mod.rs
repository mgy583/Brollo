use mongodb::{Client, Database};
use redis::aio::ConnectionManager;
use std::sync::Arc;

#[derive(Clone)]
pub struct DatabaseConnection {
    pub mongo: Arc<Database>,
    pub redis: Arc<ConnectionManager>,
}

impl DatabaseConnection {
    pub async fn new(mongo_uri: &str, redis_uri: &str, db_name: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let mongo_client = Client::with_uri_str(mongo_uri).await?;
        let mongo = Arc::new(mongo_client.database(db_name));
        
        let redis_client = redis::Client::open(redis_uri)?;
        let redis_conn = ConnectionManager::new(redis_client).await?;
        let redis = Arc::new(redis_conn);
        
        Ok(Self { mongo, redis })
    }
}
