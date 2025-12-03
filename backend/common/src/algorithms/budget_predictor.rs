use chrono::{DateTime, Datelike, Utc};
use std::collections::HashMap;

/// 滑动窗口预算预测器
pub struct BudgetPredictor {
    window_size: usize,
    holiday_factors: HashMap<String, f64>,
}

/// 预测结果
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PredictionResult {
    pub predicted_total: f64,
    pub predicted_exceed: f64,
    pub confidence: f64,
    pub daily_average: f64,
    pub weighted_average: f64,
}

impl BudgetPredictor {
    /// 创建新的预测器
    pub fn new(window_size: usize) -> Self {
        let mut holiday_factors = HashMap::new();
        holiday_factors.insert("workday".to_string(), 1.0);
        holiday_factors.insert("weekend".to_string(), 1.3);
        holiday_factors.insert("holiday".to_string(), 1.8);
        holiday_factors.insert("promotion".to_string(), 2.5);
        
        Self {
            window_size,
            holiday_factors,
        }
    }
    
    /// 执行预算预测
    pub fn predict(
        &self,
        spending_history: &[(DateTime<Utc>, f64)],
        budget_amount: f64,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
        current_time: DateTime<Utc>,
    ) -> PredictionResult {
        let days_elapsed = (current_time - period_start).num_days() as usize;
        let actual_window = self.window_size.min(days_elapsed).max(1);
        
        let window_start = current_time - chrono::Duration::days(actual_window as i64);
        let window_data: Vec<f64> = spending_history
            .iter()
            .filter(|(date, _)| *date >= window_start && *date <= current_time)
            .map(|(_, amount)| *amount)
            .collect();
        
        if window_data.is_empty() {
            return PredictionResult {
                predicted_total: 0.0,
                predicted_exceed: 0.0,
                confidence: 0.0,
                daily_average: 0.0,
                weighted_average: 0.0,
            };
        }
        
        let daily_avg: f64 = window_data.iter().sum::<f64>() / window_data.len() as f64;
        let weighted_avg = self.calculate_weighted_average(&window_data);
        
        let spent_so_far: f64 = spending_history
            .iter()
            .filter(|(date, _)| *date >= period_start && *date <= current_time)
            .map(|(_, amount)| *amount)
            .sum();
        
        let days_left = (period_end - current_time).num_days().max(0) as usize;
        let avg_holiday_factor = self.estimate_holiday_factor(current_time, period_end);
        
        let predicted_total = spent_so_far + weighted_avg * days_left as f64 * avg_holiday_factor;
        let predicted_exceed = (predicted_total - budget_amount).max(0.0);
        let confidence = self.calculate_confidence(&window_data, daily_avg);
        
        PredictionResult {
            predicted_total,
            predicted_exceed,
            confidence,
            daily_average: daily_avg,
            weighted_average: weighted_avg,
        }
    }
    
    fn calculate_weighted_average(&self, data: &[f64]) -> f64 {
        let n = data.len();
        if n == 0 {
            return 0.0;
        }
        
        let weight_sum: f64 = (1..=n).sum::<usize>() as f64;
        let weighted_sum: f64 = data
            .iter()
            .enumerate()
            .map(|(i, &value)| value * (i + 1) as f64)
            .sum();
        
        weighted_sum / weight_sum
    }
    
    fn estimate_holiday_factor(&self, start: DateTime<Utc>, end: DateTime<Utc>) -> f64 {
        let mut total_factor = 0.0;
        let mut days = 0;
        
        let mut current = start;
        while current <= end {
            let day_type = self.get_day_type(current);
            total_factor += self.holiday_factors.get(&day_type).unwrap_or(&1.0);
            days += 1;
            current += chrono::Duration::days(1);
        }
        
        if days > 0 {
            total_factor / days as f64
        } else {
            1.0
        }
    }
    
    fn get_day_type(&self, date: DateTime<Utc>) -> String {
        match date.weekday() {
            chrono::Weekday::Sat | chrono::Weekday::Sun => "weekend".to_string(),
            _ => "workday".to_string(),
        }
    }
    
    fn calculate_confidence(&self, data: &[f64], mean: f64) -> f64 {
        if data.len() < 2 {
            return 0.5;
        }
        
        let variance: f64 = data
            .iter()
            .map(|&x| (x - mean).powi(2))
            .sum::<f64>() / data.len() as f64;
        let std_dev = variance.sqrt();
        
        let cv = if mean > 0.0 {
            std_dev / mean
        } else {
            1.0
        };
        
        1.0 / (1.0 + cv)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_budget_prediction() {
        let predictor = BudgetPredictor::new(30);
        
        let start = Utc::now() - chrono::Duration::days(30);
        let spending_history: Vec<(DateTime<Utc>, f64)> = (0..30)
            .map(|i| {
                let date = start + chrono::Duration::days(i);
                let amount = 100.0 + (i as f64 * 2.0);
                (date, amount)
            })
            .collect();
        
        let period_start = start;
        let period_end = start + chrono::Duration::days(60);
        let current_time = Utc::now();
        let budget_amount = 5000.0;
        
        let result = predictor.predict(
            &spending_history,
            budget_amount,
            period_start,
            period_end,
            current_time,
        );
        
        assert!(result.predicted_total > 0.0);
        assert!(result.confidence >= 0.0 && result.confidence <= 1.0);
    }
}
