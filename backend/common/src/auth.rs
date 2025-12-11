use crate::error::{Error, Result};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,      // 用户ID
    pub user_id: String,  // 用户ID
    pub username: String,
    pub role: String,
    pub iat: i64,         // 签发时间
    pub exp: i64,         // 过期时间
}

pub struct JwtManager {
    secret: String,
    access_token_expiry: Duration,
    refresh_token_expiry: Duration,
}

impl JwtManager {
    pub fn new(secret: String) -> Self {
        Self {
            secret,
            access_token_expiry: Duration::hours(2),
            refresh_token_expiry: Duration::days(7),
        }
    }

    pub fn generate_access_token(
        &self,
        user_id: &str,
        username: &str,
        role: &str,
    ) -> Result<String> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            user_id: user_id.to_string(),
            username: username.to_string(),
            role: role.to_string(),
            iat: now.timestamp(),
            exp: (now + self.access_token_expiry).timestamp(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
        .map_err(|e| Error::InternalServer(format!("Failed to generate token: {}", e)))
    }

    pub fn generate_refresh_token(
        &self,
        user_id: &str,
        username: &str,
        role: &str,
    ) -> Result<String> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            user_id: user_id.to_string(),
            username: String::new(),
            role: "refresh".to_string(),
            iat: now.timestamp(),
            exp: (now + self.refresh_token_expiry).timestamp(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
        .map_err(|e| Error::InternalServer(format!("Failed to generate refresh token: {}", e)))
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret.as_bytes()),
            &Validation::default(),
        )
        .map(|data| data.claims)
        .map_err(|e| Error::Unauthorized(format!("Invalid token: {}", e)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_and_verify_token() {
        let manager = JwtManager::new("test_secret".to_string());
        let token = manager
            .generate_access_token("user123", "testuser", "user")
            .unwrap();

        let claims = manager.verify_token(&token).unwrap();
        assert_eq!(claims.sub, "user123");
        assert_eq!(claims.username, "testuser");
        assert_eq!(claims.role, "user");
    }
}
