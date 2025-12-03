use axum::{
    extract::{Path, Query, State, Extension},
    Json,
};
use common::{Account, ApiResponse, PaginationResponse, PaginationMeta, Claims, Error, Result};
use mongodb::{bson::{doc, oid::ObjectId}, options::FindOptions};
use std::sync::Arc;
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateAccountRequest {
    pub name: String,
    pub account_type: String,
    pub currency: String,
    pub initial_balance: f64,
    pub current_balance: f64,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub is_excluded_from_total: bool,
    pub status: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateAccountRequest {
    pub name: String,
    pub account_type: String,
    pub currency: String,
    pub status: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
}

#[derive(Deserialize)]
pub struct ListQuery {
    #[serde(default = "default_page")]
    page: u64,
    #[serde(default = "default_page_size")]
    page_size: u64,
}

fn default_page() -> u64 { 1 }
fn default_page_size() -> u64 { 10 }

pub async fn list_accounts(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ListQuery>,
) -> Result<Json<ApiResponse<PaginationResponse<Account>>>> {
    let collection = state.db.mongo.collection::<Account>("accounts");
    
    let filter = doc! { "user_id": &claims.user_id };
    let total = collection.count_documents(filter.clone(), None).await?;
    
    let skip = (query.page - 1) * query.page_size;
    let options = FindOptions::builder()
        .skip(skip)
        .limit(query.page_size as i64)
        .build();
    
    let mut cursor = collection.find(filter, options).await?;
    
    let mut accounts = Vec::new();
    while cursor.advance().await? {
        accounts.push(cursor.deserialize_current()?);
    }
    
    Ok(Json(ApiResponse::success(PaginationResponse {
        items: accounts,
        pagination: PaginationMeta::new(total, query.page, query.page_size),
    })))
}

pub async fn create_account(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateAccountRequest>,
) -> Result<Json<ApiResponse<Account>>> {
    let account = Account {
        id: Some(ObjectId::new().to_hex()),
        user_id: claims.user_id,
        name: req.name,
        account_type: req.account_type,
        currency: req.currency,
        initial_balance: req.initial_balance,
        current_balance: req.current_balance,
        available_credit: None,
        icon: req.icon.unwrap_or_else(|| "default".to_string()),
        color: req.color.unwrap_or_else(|| "#1890ff".to_string()),
        description: None,
        meta: None,
        is_excluded_from_total: req.is_excluded_from_total,
        status: req.status,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let collection = state.db.mongo.collection::<Account>("accounts");
    collection.insert_one(&account, None).await?;
    
    Ok(Json(ApiResponse::success(account)))
}

pub async fn get_account(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Account>>> {
    let collection = state.db.mongo.collection::<Account>("accounts");
    let account = collection
        .find_one(doc! { "_id": &id, "user_id": &claims.user_id }, None)
        .await?
        .ok_or_else(|| Error::NotFound("Account not found".to_string()))?;
    
    Ok(Json(ApiResponse::success(account)))
}

pub async fn update_account(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(req): Json<UpdateAccountRequest>,
) -> Result<Json<ApiResponse<Account>>> {
    let collection = state.db.mongo.collection::<Account>("accounts");
    
    let mut update_fields = doc! {
        "name": &req.name,
        "account_type": &req.account_type,
        "currency": &req.currency,
        "updated_at": mongodb::bson::to_bson(&chrono::Utc::now()).unwrap(),
    };
    
    if let Some(status) = &req.status {
        update_fields.insert("status", status);
    }
    if let Some(icon) = &req.icon {
        update_fields.insert("icon", icon);
    }
    if let Some(color) = &req.color {
        update_fields.insert("color", color);
    }
    
    let update_doc = doc! { "$set": update_fields };
    
    collection
        .update_one(doc! { "_id": &id, "user_id": &claims.user_id }, update_doc, None)
        .await?;
    
    let updated = collection
        .find_one(doc! { "_id": &id }, None)
        .await?
        .ok_or_else(|| Error::NotFound("Account not found".to_string()))?;
    
    Ok(Json(ApiResponse::success(updated)))
}

pub async fn delete_account(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<()>>> {
    let collection = state.db.mongo.collection::<Account>("accounts");
    let result = collection
        .delete_one(doc! { "_id": &id, "user_id": &claims.user_id }, None)
        .await?;
    
    if result.deleted_count == 0 {
        return Err(Error::NotFound("Account not found".to_string()));
    }
    
    Ok(Json(ApiResponse::success(())))
}

pub async fn get_balance(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<f64>>> {
    let oid = ObjectId::parse_str(&id).map_err(|_| Error::InvalidInput("Invalid account ID".to_string()))?;
    
    let collection = state.db.mongo.collection::<Account>("accounts");
    let account = collection
        .find_one(doc! { "_id": oid, "user_id": &claims.user_id }, None)
        .await?
        .ok_or_else(|| Error::NotFound("Account not found".to_string()))?;
    
    Ok(Json(ApiResponse::success(account.current_balance)))
}

pub async fn get_account_transactions(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Query(query): Query<ListQuery>,
) -> Result<Json<ApiResponse<PaginationResponse<common::Transaction>>>> {
    let _oid = ObjectId::parse_str(&id).map_err(|_| Error::InvalidInput("Invalid account ID".to_string()))?;
    
    let collection = state.db.mongo.collection::<common::Transaction>("transactions");
    
    let filter = doc! { 
        "$or": [
            { "account_id": &id },
            { "to_account_id": &id }
        ],
        "user_id": &claims.user_id
    };
    
    let total = collection.count_documents(filter.clone(), None).await?;
    
    let skip = (query.page - 1) * query.page_size;
    let options = FindOptions::builder()
        .sort(doc! { "transaction_date": -1 })
        .skip(skip)
        .limit(query.page_size as i64)
        .build();
    
    let mut cursor = collection.find(filter, options).await?;
    
    let mut transactions = Vec::new();
    while cursor.advance().await? {
        transactions.push(cursor.deserialize_current()?);
    }
    
    Ok(Json(ApiResponse::success(PaginationResponse {
        items: transactions,
        pagination: PaginationMeta::new(total, query.page, query.page_size),
    })))
}
