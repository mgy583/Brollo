use axum::{
    extract::{Path, Query, State, Extension},
    Json,
};
use common::{Transaction, Category, ApiResponse, PaginationResponse, PaginationMeta, Claims, Error, Result};
use mongodb::{bson::{self, doc, oid::ObjectId}, options::FindOptions};
use std::sync::Arc;
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub category_type: String,
    pub icon: String,
    pub color: String,
    pub parent_id: Option<String>,
    pub order: i32,
    pub is_system: bool,
    pub is_archived: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateTransactionRequest {
    pub transaction_type: String,
    pub amount: f64,
    pub currency: String,
    pub account_id: String,
    pub category_id: String,
    pub description: Option<String>,
    pub transaction_date: String,
    pub status: String,
}

#[derive(Deserialize)]
pub struct ListQuery {
    #[serde(default = "default_page")]
    page: u64,
    #[serde(default = "default_page_size")]
    page_size: u64,
    category_id: Option<String>,
    transaction_type: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
}

fn default_page() -> u64 { 1 }
fn default_page_size() -> u64 { 10 }

#[derive(Serialize)]
pub struct Statistics {
    pub total_income: f64,
    pub total_expense: f64,
    pub transaction_count: u32,
    pub by_category: Vec<CategoryStat>,
}

#[derive(Serialize)]
pub struct CategoryStat {
    pub category_id: String,
    pub category_name: String,
    pub amount: f64,
    pub count: u32,
}

pub async fn list_transactions(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ListQuery>,
) -> Result<Json<ApiResponse<PaginationResponse<Transaction>>>> {
    let collection = state.db.mongo.collection::<Transaction>("transactions");
    
    let mut filter = doc! { "user_id": &claims.user_id };
    
    if let Some(category_id) = query.category_id {
        filter.insert("category_id", category_id);
    }
    if let Some(tx_type) = query.transaction_type {
        filter.insert("transaction_type", tx_type);
    }
    
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

pub async fn create_transaction(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateTransactionRequest>,
) -> Result<Json<ApiResponse<Transaction>>> {
    use chrono::DateTime;
    
    let transaction_date = DateTime::parse_from_rfc3339(&req.transaction_date)
        .map_err(|_| Error::InvalidInput("Invalid date format".to_string()))?
        .with_timezone(&chrono::Utc);
    
    let transaction = Transaction {
        id: Some(ObjectId::new().to_hex()),
        user_id: claims.user_id.clone(),
        transaction_type: req.transaction_type,
        amount: req.amount,
        currency: req.currency,
        account_id: req.account_id,
        to_account_id: None,
        category_id: req.category_id,
        subcategory_id: None,
        tags: None,
        description: req.description.unwrap_or_default(),
        payee: None,
        transaction_date,
        location: None,
        attachments: None,
        dedup_hash: None,
        external_id: None,
        status: req.status,
        notes: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        created_by: claims.user_id,
    };
    
    let collection = state.db.mongo.collection::<Transaction>("transactions");
    collection.insert_one(&transaction, None).await?;
    
    Ok(Json(ApiResponse::success(transaction)))
}

pub async fn get_transaction(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Transaction>>> {
    let oid = ObjectId::parse_str(&id)
        .map_err(|_| Error::InvalidInput("Invalid transaction ID".to_string()))?;
    
    let collection = state.db.mongo.collection::<Transaction>("transactions");
    let transaction = collection
        .find_one(doc! { "_id": oid, "user_id": &claims.user_id }, None)
        .await?
        .ok_or_else(|| Error::NotFound("Transaction not found".to_string()))?;
    
    Ok(Json(ApiResponse::success(transaction)))
}

pub async fn update_transaction(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(transaction): Json<Transaction>,
) -> Result<Json<ApiResponse<Transaction>>> {
    let oid = ObjectId::parse_str(&id)
        .map_err(|_| Error::InvalidInput("Invalid transaction ID".to_string()))?;
    
    let collection = state.db.mongo.collection::<Transaction>("transactions");
    
    let update_doc = doc! {
        "$set": {
            "amount": transaction.amount,
            "category_id": &transaction.category_id,
            "description": &transaction.description,
            "transaction_date": bson::to_bson(&transaction.transaction_date).unwrap(),
        }
    };
    
    collection
        .update_one(doc! { "_id": oid, "user_id": &claims.user_id }, update_doc, None)
        .await?;
    
    let updated = collection
        .find_one(doc! { "_id": oid }, None)
        .await?
        .ok_or_else(|| Error::NotFound("Transaction not found".to_string()))?;
    
    Ok(Json(ApiResponse::success(updated)))
}

pub async fn delete_transaction(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<()>>> {
    let oid = ObjectId::parse_str(&id)
        .map_err(|_| Error::InvalidInput("Invalid transaction ID".to_string()))?;
    
    let collection = state.db.mongo.collection::<Transaction>("transactions");
    let result = collection
        .delete_one(doc! { "_id": oid, "user_id": &claims.user_id }, None)
        .await?;
    
    if result.deleted_count == 0 {
        return Err(Error::NotFound("Transaction not found".to_string()));
    }
    
    Ok(Json(ApiResponse::success(())))
}

pub async fn get_statistics(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<ApiResponse<Statistics>>> {
    let collection = state.db.mongo.collection::<Transaction>("transactions");
    
    let filter = doc! { "user_id": &claims.user_id };
    let mut cursor = collection.find(filter, None).await?;
    
    let mut total_income = 0.0;
    let mut total_expense = 0.0;
    let mut transaction_count = 0;
    
    while cursor.advance().await? {
        let tx: Transaction = cursor.deserialize_current()?;
        transaction_count += 1;
        
        match tx.transaction_type.as_str() {
            "income" => total_income += tx.amount,
            "expense" => total_expense += tx.amount,
            _ => {}
        }
    }
    
    Ok(Json(ApiResponse::success(Statistics {
        total_income,
        total_expense,
        transaction_count,
        by_category: Vec::new(), // 简化实现
    })))
}

pub async fn list_categories(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<ApiResponse<Vec<Category>>>> {
    let collection = state.db.mongo.collection::<Category>("categories");
    
    let filter = doc! { "user_id": &claims.user_id };
    let mut cursor = collection.find(filter, None).await?;
    
    let mut categories = Vec::new();
    while cursor.advance().await? {
        categories.push(cursor.deserialize_current()?);
    }
    
    Ok(Json(ApiResponse::success(categories)))
}

pub async fn create_category(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateCategoryRequest>,
) -> Result<Json<ApiResponse<Category>>> {
    let category = Category {
        id: Some(ObjectId::new().to_hex()),
        user_id: Some(claims.user_id),
        name: req.name,
        category_type: req.category_type,
        icon: req.icon,
        color: req.color,
        parent_id: req.parent_id,
        order: req.order,
        is_system: req.is_system,
        is_archived: req.is_archived,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let collection = state.db.mongo.collection::<Category>("categories");
    collection.insert_one(&category, None).await?;
    
    Ok(Json(ApiResponse::success(category)))
}
