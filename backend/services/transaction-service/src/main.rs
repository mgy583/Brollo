mod handlers;

use axum::{
    routing::{get, post, put, delete},
    Router,
    middleware,
};
use common::{DatabaseConnection, middleware::auth_middleware};
use std::sync::Arc;

pub struct AppState {
    pub db: DatabaseConnection,
}

pub fn create_router(db: DatabaseConnection) -> Router {
    let state = Arc::new(AppState { db: db.clone() });
    
    Router::new()
        .route("/transactions", get(handlers::list_transactions))
        .route("/transactions", post(handlers::create_transaction))
        .route("/transactions/:id", get(handlers::get_transaction))
        .route("/transactions/:id", put(handlers::update_transaction))
        .route("/transactions/:id", delete(handlers::delete_transaction))
        .route("/transactions/statistics", get(handlers::get_statistics))
        .route("/categories", get(handlers::list_categories))
        .route("/categories", post(handlers::create_category))
        .layer(middleware::from_fn_with_state(db.clone(), auth_middleware))
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
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3002")
        .await
        .expect("Failed to bind port");
    
    tracing::info!("Transaction service listening on port 3002");
    
    axum::serve(listener, app)
        .await
        .expect("Failed to start server");
}
