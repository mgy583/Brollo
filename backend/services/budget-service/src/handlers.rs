use axum::{
    extract::{Path, Query, State, Extension},
    Json,
};
use common::{Budget, Transaction, ApiResponse, PaginationResponse, PaginationMeta, Claims, Error, Result, BudgetPredictor, PredictionResult};
use mongodb::{bson::{self, doc, oid::ObjectId}, options::FindOptions};
use std::sync::Arc;
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateBudgetRequest {
    pub category_id: String,
    pub amount: f64,
    pub period: String,
    pub start_date: String,
    pub end_date: String,
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

pub async fn list_budgets(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ListQuery>,
) -> Result<Json<ApiResponse<PaginationResponse<Budget>>>> {
    let collection = state.db.mongo.collection::<Budget>("budgets");
    
    let filter = doc! { "user_id": &claims.user_id };
    let total = collection.count_documents(filter.clone(), None).await?;
    
    let skip = (query.page - 1) * query.page_size;
    let options = FindOptions::builder()
        .skip(skip)
        .limit(query.page_size as i64)
        .build();
    
    let mut cursor = collection.find(filter, options).await?;
    
    let mut budgets = Vec::new();
    while cursor.advance().await? {
        budgets.push(cursor.deserialize_current()?);
    }
    
    Ok(Json(ApiResponse::success(PaginationResponse {
        items: budgets,
        pagination: PaginationMeta::new(total, query.page, query.page_size),
    })))
}

pub async fn create_budget(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(mut budget): Json<Budget>,
) -> Result<Json<ApiResponse<Budget>>> {
    budget.user_id = claims.user_id;
    budget.id = Some(ObjectId::new().to_hex());
    
    let collection = state.db.mongo.collection::<Budget>("budgets");
    collection.insert_one(&budget, None).await?;
    
    Ok(Json(ApiResponse::success(budget)))
}

pub async fn get_budget(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Budget>>> {
    let collection = state.db.mongo.collection::<Budget>("budgets");
    let budget = collection
        .find_one(doc! { "_id": &id, "user_id": &claims.user_id }, None)
        .await?
        .ok_or_else(|| Error::NotFound("Budget not found".to_string()))?;
    
    Ok(Json(ApiResponse::success(budget)))
}

pub async fn update_budget(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(req): Json<UpdateBudgetRequest>,
) -> Result<Json<ApiResponse<Budget>>> {
    use chrono::DateTime;
    
    let start_date = DateTime::parse_from_rfc3339(&req.start_date)
        .map_err(|_| Error::InvalidInput("Invalid start date format".to_string()))?
        .with_timezone(&chrono::Utc);
    
    let end_date = DateTime::parse_from_rfc3339(&req.end_date)
        .map_err(|_| Error::InvalidInput("Invalid end date format".to_string()))?
        .with_timezone(&chrono::Utc);
    
    let collection = state.db.mongo.collection::<Budget>("budgets");
    
    let update_doc = doc! {
        "$set": {
            "category_ids": vec![&req.category_id],
            "amount": req.amount,
            "budget_type": &req.period,
            "start_date": bson::to_bson(&start_date).unwrap(),
            "end_date": bson::to_bson(&end_date).unwrap(),
            "updated_at": mongodb::bson::to_bson(&chrono::Utc::now()).unwrap(),
        }
    };
    
    collection
        .update_one(doc! { "_id": &id, "user_id": &claims.user_id }, update_doc, None)
        .await?;
    
    let updated = collection
        .find_one(doc! { "_id": &id }, None)
        .await?
        .ok_or_else(|| Error::NotFound("Budget not found".to_string()))?;
    
    Ok(Json(ApiResponse::success(updated)))
}

pub async fn delete_budget(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<()>>> {
    let collection = state.db.mongo.collection::<Budget>("budgets");
    let result = collection
        .delete_one(doc! { "_id": &id, "user_id": &claims.user_id }, None)
        .await?;
    
    if result.deleted_count == 0 {
        return Err(Error::NotFound("Budget not found".to_string()));
    }
    
    Ok(Json(ApiResponse::success(())))
}

pub async fn predict_budget(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<PredictionResult>>> {
    let collection = state.db.mongo.collection::<Budget>("budgets");
    let budget = collection
        .find_one(doc! { "_id": &id, "user_id": &claims.user_id }, None)
        .await?
        .ok_or_else(|| Error::NotFound("Budget not found".to_string()))?;
    
    // 获取交易历史
    let tx_collection = state.db.mongo.collection::<Transaction>("transactions");
    
    // 只使用第一个category_id进行查询
    let category_id = budget.category_ids.first()
        .ok_or_else(|| Error::InvalidInput("No category IDs in budget".to_string()))?;
    
    let filter = doc! {
        "user_id": &claims.user_id,
        "category_id": category_id,
        "transaction_type": "expense",
        "transaction_date": {
            "$gte": bson::to_bson(&budget.start_date).unwrap(),
            "$lte": bson::to_bson(&chrono::Utc::now()).unwrap(),
        }
    };
    
    let mut cursor = tx_collection.find(filter, None).await?;
    let mut spending_history = Vec::new();
    
    while cursor.advance().await? {
        let tx: Transaction = cursor.deserialize_current()?;
        spending_history.push((tx.transaction_date, tx.amount));
    }
    
    // 执行预测
    let predictor = BudgetPredictor::new(30);
    let prediction = predictor.predict(
        &spending_history,
        budget.amount,
        budget.start_date,
        budget.end_date,
        chrono::Utc::now(),
    );
    
    Ok(Json(ApiResponse::success(prediction)))
}
