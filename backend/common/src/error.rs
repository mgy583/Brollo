use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use std::fmt;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    NotFound(String),
    BadRequest(String),
    Unauthorized(String),
    Forbidden(String),
    Conflict(String),
    InternalServer(String),
    Database(String),
    Validation(String),
    InvalidInput(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::NotFound(msg) => write!(f, "Not found: {}", msg),
            Error::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            Error::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            Error::Forbidden(msg) => write!(f, "Forbidden: {}", msg),
            Error::Conflict(msg) => write!(f, "Conflict: {}", msg),
            Error::InternalServer(msg) => write!(f, "Internal server error: {}", msg),
            Error::Database(msg) => write!(f, "Database error: {}", msg),
            Error::Validation(msg) => write!(f, "Validation error: {}", msg),
            Error::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
        }
    }
}

impl std::error::Error for Error {}

#[derive(Serialize)]
struct ErrorResponse {
    success: bool,
    error: ErrorDetail,
    timestamp: String,
}

#[derive(Serialize)]
struct ErrorDetail {
    code: String,
    message: String,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let (status, code, message) = match self {
            Error::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg),
            Error::BadRequest(msg) => (StatusCode::BAD_REQUEST, "BAD_REQUEST", msg),
            Error::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", msg),
            Error::Forbidden(msg) => (StatusCode::FORBIDDEN, "FORBIDDEN", msg),
            Error::Conflict(msg) => (StatusCode::CONFLICT, "CONFLICT", msg),
            Error::InternalServer(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", msg)
            }
            Error::Database(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", msg)
            }
            Error::Validation(msg) => (StatusCode::BAD_REQUEST, "VALIDATION_ERROR", msg),
            Error::InvalidInput(msg) => (StatusCode::BAD_REQUEST, "INVALID_INPUT", msg),
        };

        let error_response = ErrorResponse {
            success: false,
            error: ErrorDetail {
                code: code.to_string(),
                message,
            },
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        (status, Json(error_response)).into_response()
    }
}

// 实现从其他错误类型的转换
impl From<mongodb::error::Error> for Error {
    fn from(err: mongodb::error::Error) -> Self {
        Error::Database(err.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for Error {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        Error::Unauthorized(err.to_string())
    }
}
