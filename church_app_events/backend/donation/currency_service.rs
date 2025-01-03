//! Currency Service Module
//!
//! This module provides high-level currency operations including:
//! - Currency retrieval with caching
//! - Exchange rate management
//! - Currency conversion
//! - Cache management
//!
//! The service implements a caching layer over the CurrencyRepository
//! to improve performance and reduce database load.

use super::currency::{Currency, CurrencyRepository};
use anyhow::Result;
use rust_decimal::Decimal;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};

// ============= Type Definitions =============

/// Service for handling currency operations with caching
pub struct CurrencyService {
    /// Underlying repository for database operations
    repository: CurrencyRepository,

    /// Thread-safe cached currency data
    /// Key: Currency code
    /// Value: (Currency data, Cache timestamp)
    cache: Arc<RwLock<HashMap<String, (Currency, DateTime<Utc>)>>>,

    /// Duration for which cached data is considered valid
    cache_duration: Duration,
}

// ============= Service Implementation =============

impl CurrencyService {
    /// Creates a new CurrencyService instance with 1-hour cache duration
    ///
    /// # Arguments
    /// * `repository` - The currency repository for database operations
    pub fn new(repository: CurrencyRepository) -> Self {
        Self {
            repository,
            cache: Arc::new(RwLock::new(HashMap::new())),
            cache_duration: Duration::hours(1),
        }
    }

    /// Retrieves a currency by its code, using cache when available
    ///
    /// # Arguments
    /// * `code` - ISO 4217 currency code
    ///
    /// # Returns
    /// * `Result<Currency>` - The requested currency or error
    pub async fn get_currency(&self, code: &str) -> Result<Currency> {
        // Try to get from cache first
        if let Some(cached) = self.get_from_cache(code).await {
            return Ok(cached);
        }

        // Cache miss - fetch from database
        let currency = self.repository
            .get_currency(code)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Currency not found: {}", code))?;

        // Update cache with fresh data
        self.update_cache(currency.clone()).await;

        Ok(currency)
    }

    /// Updates the exchange rate for a specific currency
    ///
    /// # Arguments
    /// * `code` - Currency code to update
    /// * `new_rate` - New exchange rate value
    ///
    /// # Returns
    /// * `Result<Currency>` - Updated currency or error
    pub async fn update_exchange_rate(
        &self,
        code: &str,
        new_rate: Decimal
    ) -> Result<Currency> {
        // Update in database
        let currency = self.repository.update_exchange_rate(code, new_rate).await?;

        // Update cache with new rate
        self.update_cache(currency.clone()).await;

        Ok(currency)
    }

    /// Converts an amount between two currencies
    ///
    /// # Arguments
    /// * `amount` - Amount to convert
    /// * `from_currency` - Source currency code
    /// * `to_currency` - Target currency code
    ///
    /// # Returns
    /// * `Result<Decimal>` - Converted amount or error
    pub async fn convert_amount(
        &self,
        amount: Decimal,
        from_currency: &str,
        to_currency: &str
    ) -> Result<Decimal> {
        // Short circuit if same currency
        if from_currency == to_currency {
            return Ok(amount);
        }

        // Get both currencies (uses cache)
        let from = self.get_currency(from_currency).await?;
        let to = self.get_currency(to_currency).await?;

        // Convert through USD as intermediate currency
        let usd_amount = from.to_usd(amount);
        Ok(to.from_usd(usd_amount))
    }

    // ============= Cache Management Methods =============

    /// Retrieves a currency from cache if available and not expired
    ///
    /// # Arguments
    /// * `code` - Currency code to lookup
    ///
    /// # Returns
    /// * `Option<Currency>` - Cached currency if valid
    async fn get_from_cache(&self, code: &str) -> Option<Currency> {
        let cache = self.cache.read().await;
        if let Some((currency, cached_at)) = cache.get(code) {
            // Check if cache entry is still valid
            if Utc::now() - *cached_at < self.cache_duration {
                return Some(currency.clone());
            }
        }
        None
    }

    /// Updates the cache with new currency data
    ///
    /// # Arguments
    /// * `currency` - Currency to cache
    async fn update_cache(&self, currency: Currency) {
        let mut cache = self.cache.write().await;
        cache.insert(currency.code.clone(), (currency, Utc::now()));
    }

    /// Clears all cached currency data
    ///
    /// This can be useful when needing to force fresh data fetches
    pub async fn clear_cache(&self) {
        let mut cache = self.cache.write().await;
        cache.clear();
    }
}

// ============= Tests =============

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    // TODO: Add tests for:
    // - Cache hit/miss scenarios
    // - Currency conversion
    // - Exchange rate updates
    // - Cache expiration
    // - Error cases
}
