mod handlers;

use axum::{
    middleware,
    routing::{get, post, put},
    Router,
};
use common::{middleware::auth_middleware, DatabaseConnection};
use std::sync::Arc;

pub struct AppState {
    pub db: DatabaseConnection,
}

pub fn create_router(db: DatabaseConnection) -> Router {
    let state = Arc::new(AppState { db: db.clone() });
    
    let protected_routes = Router::new()
        .route("/profile", get(handlers::get_profile))
        .route("/profile", put(handlers::update_profile))
        .layer(middleware::from_fn_with_state(db.clone(), auth_middleware));
    
    Router::new()
        .route("/register", post(handlers::register))
        .route("/login", post(handlers::login))
        .route("/refresh", post(handlers::refresh_token))
        .merge(protected_routes)
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
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind port");
    
    tracing::info!("User service listening on port 3000");
    
    axum::serve(listener, app)
        .await
        .expect("Failed to start server");
}
