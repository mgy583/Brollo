use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct RateSource {
    pub name: String,
    pub rate: f64,
    pub weight: f64,
    pub noise_variance: f64,
}

pub struct KalmanFilter {
    x: f64,  // 状态估计
    p: f64,  // 估计误差协方差
    q: f64,  // 过程噪声协方差
    r: f64,  // 观测噪声协方差
}

impl KalmanFilter {
    pub fn new(initial_rate: f64, initial_variance: f64) -> Self {
        Self {
            x: initial_rate,
            p: initial_variance,
            q: 0.0001,
            r: 0.01,
        }
    }
    
    pub fn predict(&mut self) {
        self.p += self.q;
    }
    
    pub fn update(&mut self, measurement: f64, measurement_noise: f64) {
        self.r = measurement_noise;
        
        let kalman_gain = self.p / (self.p + self.r);
        self.x += kalman_gain * (measurement - self.x);
        self.p *= 1.0 - kalman_gain;
    }
    
    pub fn get_estimate(&self) -> f64 {
        self.x
    }
    
    pub fn get_variance(&self) -> f64 {
        self.p
    }
}

pub struct ExchangeRateFusion {
    filters: HashMap<String, KalmanFilter>,
}

impl ExchangeRateFusion {
    pub fn new() -> Self {
        Self {
            filters: HashMap::new(),
        }
    }
    
    pub fn fuse_rates(
        &mut self,
        currency_pair: &str,
        sources: &[RateSource],
    ) -> f64 {
        let filter = self.filters.entry(currency_pair.to_string()).or_insert_with(|| {
            let initial_rate = Self::weighted_average(sources);
            KalmanFilter::new(initial_rate, 0.01)
        });
        
        filter.predict();
        
        for source in sources {
            filter.update(source.rate, source.noise_variance);
        }
        
        filter.get_estimate()
    }
    
    fn weighted_average(sources: &[RateSource]) -> f64 {
        let total_weight: f64 = sources.iter().map(|s| s.weight).sum();
        if total_weight > 0.0 {
            sources.iter().map(|s| s.rate * s.weight).sum::<f64>() / total_weight
        } else {
            sources.first().map(|s| s.rate).unwrap_or(0.0)
        }
    }
    
    pub fn get_rate_with_confidence(
        &self,
        currency_pair: &str,
    ) -> Option<(f64, f64)> {
        self.filters.get(currency_pair).map(|filter| {
            let rate = filter.get_estimate();
            let variance = filter.get_variance();
            let confidence = 1.0 / (1.0 + variance);
            (rate, confidence)
        })
    }
}

impl Default for ExchangeRateFusion {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_kalman_filter() {
        let mut filter = KalmanFilter::new(6.5, 0.1);
        
        let measurements = vec![6.52, 6.48, 6.51, 6.49, 6.50];
        
        for &z in &measurements {
            filter.predict();
            filter.update(z, 0.01);
        }
        
        let final_estimate = filter.get_estimate();
        assert!(final_estimate > 6.45 && final_estimate < 6.55);
    }
    
    #[test]
    fn test_rate_fusion() {
        let mut fusion = ExchangeRateFusion::new();
        
        let sources = vec![
            RateSource {
                name: "央行".to_string(),
                rate: 6.50,
                weight: 0.5,
                noise_variance: 0.0001,
            },
            RateSource {
                name: "Yahoo".to_string(),
                rate: 6.52,
                weight: 0.3,
                noise_variance: 0.01,
            },
            RateSource {
                name: "手动".to_string(),
                rate: 6.48,
                weight: 0.2,
                noise_variance: 0.05,
            },
        ];
        
        let fused_rate = fusion.fuse_rates("CNY/USD", &sources);
        assert!(fused_rate > 6.45 && fused_rate < 6.55);
    }
}
