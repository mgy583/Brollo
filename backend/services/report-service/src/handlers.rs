use axum::{
    extract::{Query, State, Extension},
    Json,
};
use common::{Transaction, ApiResponse, Claims, Result};
use mongodb::bson::doc;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::Datelike;

use crate::AppState;

#[derive(Deserialize)]
pub struct ReportQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Serialize)]
pub struct MonthlyReport {
    pub total_income: f64,
    pub total_expense: f64,
    pub net_income: f64,
    pub transaction_count: u32,
    pub top_categories: Vec<CategoryReport>,
}

#[derive(Serialize)]
pub struct CategoryReport {
    pub category_id: String,
    pub category_name: String,
    pub amount: f64,
    pub percentage: f64,
}

#[derive(Serialize)]
pub struct TrendReport {
    pub daily_data: Vec<DailyData>,
}

#[derive(Serialize)]
pub struct DailyData {
    pub date: String,
    pub income: f64,
    pub expense: f64,
}

pub async fn monthly_report(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ReportQuery>,
) -> Result<Json<ApiResponse<MonthlyReport>>> {
    let collection = state.db.mongo.collection::<Transaction>("transactions");
    
    let start_date = if let Some(date_str) = &query.start_date {
        chrono::DateTime::parse_from_rfc3339(date_str)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now())
    } else {
        let now = chrono::Utc::now();
        now.with_day(1).unwrap().with_timezone(&chrono::Utc)
    };

    let end_date = if let Some(date_str) = &query.end_date {
        chrono::DateTime::parse_from_rfc3339(date_str)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now())
    } else {
        chrono::Utc::now()
    };
    
    let filter = doc! {
        "user_id": &claims.user_id,
        "transaction_date": {
            "$gte": mongodb::bson::to_bson(&start_date).unwrap(),
            "$lte": mongodb::bson::to_bson(&end_date).unwrap(),
        }
    };
    
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
    
    let net_income = total_income - total_expense;
    
    Ok(Json(ApiResponse::success(MonthlyReport {
        total_income,
        total_expense,
        net_income,
        transaction_count,
        top_categories: Vec::new(),
    })))
}

pub async fn category_report(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ReportQuery>,
) -> Result<Json<ApiResponse<Vec<CategoryReport>>>> {
    let collection = state.db.mongo.collection::<Transaction>("transactions");
    
    let start_date = if let Some(date_str) = &query.start_date {
        chrono::DateTime::parse_from_rfc3339(date_str)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now())
    } else {
        let now = chrono::Utc::now();
        now.with_day(1).unwrap().with_timezone(&chrono::Utc)
    };

    let end_date = if let Some(date_str) = &query.end_date {
        chrono::DateTime::parse_from_rfc3339(date_str)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now())
    } else {
        chrono::Utc::now()
    };

    let filter = doc! { 
        "user_id": &claims.user_id,
        "transaction_date": {
            "$gte": mongodb::bson::to_bson(&start_date).unwrap(),
            "$lte": mongodb::bson::to_bson(&end_date).unwrap(),
        }
    };
    let mut cursor = collection.find(filter, None).await?;
    
    let mut category_totals: HashMap<String, f64> = HashMap::new();
    let mut total_amount = 0.0;
    
    while cursor.advance().await? {
        let tx: Transaction = cursor.deserialize_current()?;
        if tx.transaction_type == "expense" {
            *category_totals.entry(tx.category_id.clone()).or_insert(0.0) += tx.amount;
            total_amount += tx.amount;
        }
    }
    
    let mut reports: Vec<CategoryReport> = category_totals
        .into_iter()
        .map(|(category_id, amount)| {
            let percentage = if total_amount > 0.0 {
                (amount / total_amount) * 100.0
            } else {
                0.0
            };
            
            CategoryReport {
                category_name: category_id.clone(),
                category_id,
                amount,
                percentage,
            }
        })
        .collect();
    
    reports.sort_by(|a, b| b.amount.partial_cmp(&a.amount).unwrap());
    
    Ok(Json(ApiResponse::success(reports)))
}

pub async fn trend_report(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ReportQuery>,
) -> Result<Json<ApiResponse<TrendReport>>> {
    let collection = state.db.mongo.collection::<Transaction>("transactions");
    
    let start_date = if let Some(date_str) = &query.start_date {
        chrono::DateTime::parse_from_rfc3339(date_str)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now())
    } else {
        let now = chrono::Utc::now();
        now - chrono::Duration::days(30)
    };

    let end_date = if let Some(date_str) = &query.end_date {
        chrono::DateTime::parse_from_rfc3339(date_str)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now())
    } else {
        chrono::Utc::now()
    };
    
    let filter = doc! {
        "user_id": &claims.user_id,
        "transaction_date": {
            "$gte": mongodb::bson::to_bson(&start_date).unwrap(),
            "$lte": mongodb::bson::to_bson(&end_date).unwrap(),
        }
    };
    
    let mut cursor = collection.find(filter, None).await?;
    let mut daily_map: HashMap<String, (f64, f64)> = HashMap::new();
    
    while cursor.advance().await? {
        let tx: Transaction = cursor.deserialize_current()?;
        let date_str = tx.transaction_date.format("%Y-%m-%d").to_string();
        let entry = daily_map.entry(date_str).or_insert((0.0, 0.0));
        
        match tx.transaction_type.as_str() {
            "income" => entry.0 += tx.amount,
            "expense" => entry.1 += tx.amount,
            _ => {}
        }
    }
    
    let mut daily_data: Vec<DailyData> = daily_map
        .into_iter()
        .map(|(date, (income, expense))| DailyData {
            date,
            income,
            expense,
        })
        .collect();
    
    // Sort by date
    daily_data.sort_by(|a, b| a.date.cmp(&b.date));
    
    Ok(Json(ApiResponse::success(TrendReport { daily_data })))
}

pub async fn export_report(
    State(_state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
) -> Result<Json<ApiResponse<String>>> {
    // 简化实现，实际应生成CSV/PDF
    Ok(Json(ApiResponse::success("Report export functionality".to_string())))
}
