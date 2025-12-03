use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use crate::{Error, JwtManager};

pub async fn auth_middleware(
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;
    
    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }
    
    let token = &auth_header[7..];
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret_key".to_string());
    let jwt_manager = JwtManager::new(jwt_secret);
    
    let claims = jwt_manager
        .verify_token(token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    request.extensions_mut().insert(claims);
    Ok(next.run(request).await)
}
