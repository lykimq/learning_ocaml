//! Currency Service Module
//!
//! Handles currency-related business logic and operations

use super::currency::{Currency, CurrencyRepository};
use anyhow::Result;
use rust_decimal::Decimal;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};

/// Service for handling currency operations
pub struct CurrencyService {
    repository: CurrencyRepository,
    cache: Arc<RwLock<HashMap<String, (Currency, DateTime<Utc>)>>>,
    cache_duration: Duration,
}

impl CurrencyService {
    /// Creates a new CurrencyService instance
    pub fn new(repository: CurrencyRepository) -> Self {
        Self {
            repository,
            cache: Arc::new(RwLock::new(HashMap::new())),
            cache_duration: Duration::hours(1),
        }
    }

    /// Gets a currency by code, using cache if available
    pub async fn get_currency(&self, code: &str) -> Result<Currency> {
        // Check cache first
        if let Some(cached) = self.get_from_cache(code).await {
            return Ok(cached);
        }

        // If not in cache, get from database
        let currency = self.repository
            .get_currency(code)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Currency not found: {}", code))?;

        // Update cache
        self.update_cache(currency.clone()).await;

        Ok(currency)
    }

    /// Updates exchange rate for a currency
    pub async fn update_exchange_rate(
        &self,
        code: &str,
        new_rate: Decimal
    ) -> Result<Currency> {
        let currency = self.repository.update_exchange_rate(code, new_rate).await?;
        self.update_cache(currency.clone()).await;

        Ok(currency)
    }

    /// Converts amount between currencies
    pub async fn convert_amount(
        &self,
        amount: Decimal,
        from_currency: &str,
        to_currency: &str
    ) -> Result<Decimal> {
        if from_currency == to_currency {
            return Ok(amount);
        }

        let from = self.get_currency(from_currency).await?;
        let to = self.get_currency(to_currency).await?;

        // Convert to USD first, then to target currency
        let usd_amount = from.to_usd(amount);
        Ok(to.from_usd(usd_amount))
    }

    // ============= Cache Management =============

    async fn get_from_cache(&self, code: &str) -> Option<Currency> {
        let cache = self.cache.read().await;
        if let Some((currency, cached_at)) = cache.get(code) {
            if Utc::now() - *cached_at < self.cache_duration {
                return Some(currency.clone());
            }
        }
        None
    }

    async fn update_cache(&self, currency: Currency) {
        let mut cache = self.cache.write().await;
        cache.insert(currency.code.clone(), (currency, Utc::now()));
    }

    /// Clears the cache
    pub async fn clear_cache(&self) {
        let mut cache = self.cache.write().await;
        cache.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    // Add tests here
}
