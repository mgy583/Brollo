use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub full_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    pub settings: UserSettings,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_login_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub default_currency: String,
    pub timezone: String,
    pub language: String,
    pub theme: String,
    pub notifications: NotificationSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub email: bool,
    pub push: bool,
    pub budget_alert: bool,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            default_currency: "CNY".to_string(),
            timezone: "Asia/Shanghai".to_string(),
            language: "zh-CN".to_string(),
            theme: "light".to_string(),
            notifications: NotificationSettings {
                email: true,
                push: true,
                budget_alert: true,
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub user_id: String,
    pub name: String,
    pub account_type: String,
    pub currency: String,
    pub initial_balance: f64,
    pub current_balance: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub available_credit: Option<f64>,
    pub icon: String,
    pub color: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<serde_json::Value>,
    pub is_excluded_from_total: bool,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub user_id: String,
    pub transaction_type: String,
    pub amount: f64,
    pub currency: String,
    pub account_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub to_account_id: Option<String>,
    pub category_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subcategory_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payee: Option<String>,
    pub transaction_date: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attachments: Option<Vec<Attachment>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dedup_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub external_id: Option<String>,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Location {
    pub latitude: f64,
    pub longitude: f64,
    pub address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub file_id: String,
    pub file_name: String,
    pub file_url: String,
    pub file_size: u64,
    pub upload_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,
    pub name: String,
    pub category_type: String,
    pub icon: String,
    pub color: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub order: i32,
    pub is_system: bool,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Budget {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub user_id: String,
    pub name: String,
    pub budget_type: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub amount: f64,
    pub currency: String,
    pub category_ids: Vec<String>,
    pub account_ids: Vec<String>,
    pub spent: f64,
    pub remaining: f64,
    pub progress: f64,
    pub alert_thresholds: Vec<AlertThreshold>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prediction: Option<BudgetPrediction>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertThreshold {
    pub percentage: i32,
    pub notified: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notified_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetPrediction {
    pub predicted_total: f64,
    pub predicted_exceed: f64,
    pub confidence: f64,
    pub algorithm: String,
    pub updated_at: DateTime<Utc>,
}
