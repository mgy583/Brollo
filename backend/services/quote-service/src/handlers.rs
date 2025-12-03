use axum::{
    extract::{Path, Query, State},
    Json,
};
use common::{ApiResponse, Result, Error, ExchangeRateFusion, RateSource};
use std::sync::Arc;
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Serialize)]
pub struct QuoteResponse {
    pub pair: String,
    pub rate: f64,
    pub confidence: f64,
    pub timestamp: i64,
}

#[derive(Deserialize)]
pub struct ConvertQuery {
    pub from: String,
    pub to: String,
    pub amount: f64,
}

#[derive(Serialize)]
pub struct ConvertResponse {
    pub from_currency: String,
    pub to_currency: String,
    pub original_amount: f64,
    pub converted_amount: f64,
    pub rate: f64,
}

pub async fn get_quote(
    State(_state): State<Arc<AppState>>,
    Path(pair): Path<String>,
) -> Result<Json<ApiResponse<QuoteResponse>>> {
    // 从多个来源获取汇率
    let sources = fetch_exchange_rates(&pair).await?;
    
    // 使用卡尔曼滤波融合汇率
    let mut fusion = ExchangeRateFusion::new();
    let fused_rate = fusion.fuse_rates(&pair, &sources);
    
    let (rate, confidence) = fusion
        .get_rate_with_confidence(&pair)
        .unwrap_or((fused_rate, 1.0));
    
    Ok(Json(ApiResponse::success(QuoteResponse {
        pair,
        rate,
        confidence,
        timestamp: chrono::Utc::now().timestamp(),
    })))
}

pub async fn convert_currency(
    State(_state): State<Arc<AppState>>,
    Query(query): Query<ConvertQuery>,
) -> Result<Json<ApiResponse<ConvertResponse>>> {
    let pair = format!("{}/{}", query.from, query.to);
    let sources = fetch_exchange_rates(&pair).await?;
    
    let mut fusion = ExchangeRateFusion::new();
    let rate = fusion.fuse_rates(&pair, &sources);
    
    let converted_amount = query.amount * rate;
    
    Ok(Json(ApiResponse::success(ConvertResponse {
        from_currency: query.from,
        to_currency: query.to,
        original_amount: query.amount,
        converted_amount,
        rate,
    })))
}

async fn fetch_exchange_rates(pair: &str) -> Result<Vec<RateSource>> {
    // 模拟从多个源获取汇率
    // 实际应从真实API获取
    
    let parts: Vec<&str> = pair.split('/').collect();
    if parts.len() != 2 {
        return Err(Error::InvalidInput("Invalid currency pair".to_string()));
    }
    
    // 模拟数据
    let base_rate = 6.5; // 示例CNY/USD汇率
    
    Ok(vec![
        RateSource {
            name: "央行".to_string(),
            rate: base_rate,
            weight: 0.5,
            noise_variance: 0.0001,
        },
        RateSource {
            name: "Yahoo".to_string(),
            rate: base_rate + 0.02,
            weight: 0.3,
            noise_variance: 0.01,
        },
        RateSource {
            name: "手动".to_string(),
            rate: base_rate - 0.01,
            weight: 0.2,
            noise_variance: 0.05,
        },
    ])
}
