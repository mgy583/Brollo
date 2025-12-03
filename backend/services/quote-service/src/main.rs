mod handlers;

use axum::{
    routing::get,
    Router,
};
use common::DatabaseConnection;
use std::sync::Arc;

pub struct AppState {
    pub db: DatabaseConnection,
}

pub fn create_router(db: DatabaseConnection) -> Router {
    let state = Arc::new(AppState { db });
    
    Router::new()
        .route("/quotes/:pair", get(handlers::get_quote))
        .route("/quotes/convert", get(handlers::convert_currency))
        .with_state(state)
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    
    let mongo_uri = std::env::var("MONGO_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let redis_uri = std::env::var("REDIS_URI").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    let pg_uri = std::env::var("POSTGRES_URI").ok();
    
    let db = DatabaseConnection::new(&mongo_uri, &redis_uri, pg_uri.as_deref(), "abook")
        .await
        .expect("Failed to connect to database");
    
    let app = create_router(db);
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3005")
        .await
        .expect("Failed to bind port");
    
    tracing::info!("Quote service listening on port 3005");
    
    axum::serve(listener, app)
        .await
        .expect("Failed to start server");
}
