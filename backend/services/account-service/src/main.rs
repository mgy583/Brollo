mod handlers;
mod service;

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
        .route("/accounts", get(handlers::list_accounts))
        .route("/accounts", post(handlers::create_account))
        .route("/accounts/:id", get(handlers::get_account))
        .route("/accounts/:id", put(handlers::update_account))
        .route("/accounts/:id", delete(handlers::delete_account))
        .route("/accounts/:id/balance", get(handlers::get_balance))
        .route("/accounts/:id/transactions", get(handlers::get_account_transactions))
        .layer(middleware::from_fn_with_state(db.clone(), auth_middleware))
        .with_state(state)
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    
    let mongo_uri = std::env::var("MONGO_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let redis_uri = std::env::var("REDIS_URI").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    
    let db = DatabaseConnection::new(&mongo_uri, &redis_uri, "abook")
        .await
        .expect("Failed to connect to database");
    
    let app = create_router(db);
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .expect("Failed to bind port");
    
    tracing::info!("Account service listening on port 3001");
    
    axum::serve(listener, app)
        .await
        .expect("Failed to start server");
}
