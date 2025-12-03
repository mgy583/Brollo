use axum::{
    extract::{State, Extension},
    Json,
};
use common::{User, ApiResponse, Claims, Error, Result, JwtManager};
use mongodb::bson::{doc, oid::ObjectId};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::SaltString;
use rand::rngs::OsRng;

use crate::AppState;

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub user: User,
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<ApiResponse<AuthResponse>>> {
    let collection = state.db.mongo.collection::<User>("users");
    
    // 检查邮箱是否已存在
    if collection.find_one(doc! { "email": &req.email }, None).await?.is_some() {
        return Err(Error::Conflict("Email already exists".to_string()));
    }
    
    // 哈希密码
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(req.password.as_bytes(), &salt)
        .map_err(|_| Error::InternalServer("Failed to hash password".to_string()))?
        .to_string();
    
    let now = chrono::Utc::now();
    let mut user = User {
        id: Some(mongodb::bson::oid::ObjectId::new().to_hex()),
        username: req.username.clone(),
        email: req.email,
        password_hash,
        full_name: req.username,
        avatar_url: None,
        phone: None,
        settings: common::UserSettings {
            default_currency: "CNY".to_string(),
            timezone: "Asia/Shanghai".to_string(),
            language: "zh-CN".to_string(),
            theme: "light".to_string(),
            notifications: common::NotificationSettings {
                email: true,
                push: true,
                budget_alert: false,
            },
        },
        status: "active".to_string(),
        created_at: now,
        updated_at: now,
        last_login_at: None,
    };
    
    collection.insert_one(&user, None).await?;
    
    // 生成令牌
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret_key".to_string());
    let jwt_manager = JwtManager::new(jwt_secret);
    
    let user_id = user.id.clone().unwrap();
    let access_token = jwt_manager.generate_access_token(&user_id, &user.username, "user")?;
    let refresh_token = jwt_manager.generate_refresh_token(&user_id, &user.username, "user")?;
    
    user.password_hash = String::new(); // 不返回密码哈希
    
    Ok(Json(ApiResponse::success(AuthResponse {
        user,
        access_token,
        refresh_token,
    })))
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<ApiResponse<AuthResponse>>> {
    let collection = state.db.mongo.collection::<User>("users");
    
    let mut user = collection
        .find_one(doc! { "email": &req.email }, None)
        .await?
        .ok_or_else(|| Error::Unauthorized("Invalid credentials".to_string()))?;
    
    // 验证密码
    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| Error::InternalServer("Invalid password hash".to_string()))?;
    
    Argon2::default()
        .verify_password(req.password.as_bytes(), &parsed_hash)
        .map_err(|_| Error::Unauthorized("Invalid credentials".to_string()))?;
    
    // 生成令牌
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret_key".to_string());
    let jwt_manager = JwtManager::new(jwt_secret);
    
    let user_id = user.id.clone().unwrap();
    let access_token = jwt_manager.generate_access_token(&user_id, &user.username, "user")?;
    let refresh_token = jwt_manager.generate_refresh_token(&user_id, &user.username, "user")?;
    
    user.password_hash = String::new();
    
    Ok(Json(ApiResponse::success(AuthResponse {
        user,
        access_token,
        refresh_token,
    })))
}

pub async fn refresh_token(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<ApiResponse<String>>> {
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret_key".to_string());
    let jwt_manager = JwtManager::new(jwt_secret);
    
    let claims = jwt_manager.verify_token(&req.refresh_token)?;
    let new_access_token = jwt_manager.generate_access_token(&claims.user_id, &claims.username, &claims.role)?;
    
    Ok(Json(ApiResponse::success(new_access_token)))
}

pub async fn get_profile(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<ApiResponse<User>>> {
    let collection = state.db.mongo.collection::<User>("users");
    let mut user = collection
        .find_one(doc! { "_id": &claims.user_id }, None)
        .await?
        .ok_or_else(|| Error::NotFound("User not found".to_string()))?;
    
    user.password_hash = String::new();
    
    Ok(Json(ApiResponse::success(user)))
}

pub async fn update_profile(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(mut user): Json<User>,
) -> Result<Json<ApiResponse<User>>> {
    let collection = state.db.mongo.collection::<User>("users");
    
    let update_doc = doc! {
        "$set": {
            "username": &user.username,
            "full_name": &user.full_name,
            "avatar_url": &user.avatar_url,
            "phone": &user.phone,
        }
    };
    
    collection
        .update_one(doc! { "_id": &claims.user_id }, update_doc, None)
        .await?;
    
    user.password_hash = String::new();
    
    Ok(Json(ApiResponse::success(user)))
}
