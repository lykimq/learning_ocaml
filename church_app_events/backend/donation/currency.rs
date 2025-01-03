//! Currency Module
//!
//! This module provides functionality for:
//! - Currency management and validation
//! - Exchange rate operations
//! - Currency conversion calculations
//! - Database operations for currencies
//!
//! The module supports ISO 4217 currency codes and maintains
//! exchange rates relative to USD as the base currency.

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use anyhow::Result;

// ============= Currency Types =============

/// Represents a currency in the system
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Currency {
    /// ISO 4217 currency code (e.g., USD, EUR)
    pub code: String,

    /// Full name of the currency (e.g., "United States Dollar")
    pub name: String,

    /// Currency symbol for display (e.g., $, €, £)
    pub symbol: String,

    /// Indicates if the currency is available for use
    pub is_active: bool,

    /// Exchange rate relative to USD (1 USD = X currency)
    pub exchange_rate: Decimal,

    /// Timestamp of last exchange rate update
    pub last_updated_at: DateTime<Utc>,
}

/// Repository for managing currency data in the database
pub struct CurrencyRepository {
    pool: PgPool,
}

// ============= Currency Implementation =============

impl Currency {
    /// Creates a new Currency instance with default active status
    ///
    /// # Arguments
    /// * `code` - ISO 4217 currency code
    /// * `name` - Full currency name
    /// * `symbol` - Currency symbol
    /// * `exchange_rate` - Exchange rate relative to USD
    pub fn new(
        code: String,
        name: String,
        symbol: String,
        exchange_rate: Decimal
    ) -> Self {
        Self {
            code,
            name,
            symbol,
            is_active: true,  // New currencies are active by default
            exchange_rate,
            last_updated_at: Utc::now(),
        }
    }

    /// Converts an amount from this currency to USD
    ///
    /// # Arguments
    /// * `amount` - Amount in current currency
    ///
    /// # Returns
    /// Equivalent amount in USD
    pub fn to_usd(&self, amount: Decimal) -> Decimal {
        amount * self.exchange_rate
    }

    /// Converts an amount from USD to this currency
    ///
    /// # Arguments
    /// * `amount` - Amount in USD
    ///
    /// # Returns
    /// Equivalent amount in current currency
    pub fn from_usd(&self, amount: Decimal) -> Decimal {
        amount / self.exchange_rate
    }
}

// ============= Repository Implementation =============

impl CurrencyRepository {
    /// Creates a new CurrencyRepository instance
    ///
    /// # Arguments
    /// * `pool` - PostgreSQL connection pool
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Creates a new currency in the database
    ///
    /// # Arguments
    /// * `currency` - Currency instance to create
    ///
    /// # Returns
    /// Created currency with database-generated fields
    pub async fn create_currency(&self, currency: &Currency) -> Result<Currency> {
        let created = sqlx::query_as!(
            Currency,
            r#"
            INSERT INTO currencies
            (code, name, symbol, is_active, exchange_rate)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                code,
                name,
                symbol,
                is_active as "is_active!: bool",
                exchange_rate as "exchange_rate!: Decimal",
                last_updated_at as "last_updated_at!: DateTime<Utc>"
            "#,
            currency.code,
            currency.name,
            currency.symbol,
            currency.is_active,
            currency.exchange_rate
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(created)
    }

    /// Retrieves a currency by its code
    ///
    /// # Arguments
    /// * `code` - ISO 4217 currency code
    ///
    /// # Returns
    /// Optional currency if found
    pub async fn get_currency(&self, code: &str) -> Result<Option<Currency>> {
        let currency = sqlx::query_as!(
            Currency,
            r#"
            SELECT
                code,
                name,
                symbol,
                is_active as "is_active!: bool",
                exchange_rate as "exchange_rate!: Decimal",
                last_updated_at as "last_updated_at!: DateTime<Utc>"
            FROM currencies
            WHERE code = $1
            "#,
            code
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(currency)
    }

    /// Retrieves all active currencies
    ///
    /// # Returns
    /// Vector of active currencies, sorted by code
    pub async fn get_active_currencies(&self) -> Result<Vec<Currency>> {
        let currencies = sqlx::query_as!(
            Currency,
            r#"
            SELECT
                code,
                name,
                symbol,
                is_active as "is_active!: bool",
                exchange_rate as "exchange_rate!: Decimal",
                last_updated_at as "last_updated_at!: DateTime<Utc>"
            FROM currencies
            WHERE is_active = true
            ORDER BY code
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(currencies)
    }

    /// Updates the exchange rate for a specific currency
    ///
    /// # Arguments
    /// * `code` - Currency code to update
    /// * `new_rate` - New exchange rate value
    ///
    /// # Returns
    /// Updated currency
    pub async fn update_exchange_rate(
        &self,
        code: &str,
        new_rate: Decimal
    ) -> Result<Currency> {
        let currency = sqlx::query_as!(
            Currency,
            r#"
            UPDATE currencies
            SET
                exchange_rate = $1,
                last_updated_at = CURRENT_TIMESTAMP
            WHERE code = $2
            RETURNING
                code,
                name,
                symbol,
                is_active as "is_active!: bool",
                exchange_rate as "exchange_rate!: Decimal",
                last_updated_at as "last_updated_at!: DateTime<Utc>"
            "#,
            new_rate,
            code
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(currency)
    }

    /// Activates or deactivates a currency
    ///
    /// # Arguments
    /// * `code` - Currency code to update
    /// * `active` - New active status
    ///
    /// # Returns
    /// Updated currency
    pub async fn set_currency_active(
        &self,
        code: &str,
        active: bool
    ) -> Result<Currency> {
        let currency = sqlx::query_as!(
            Currency,
            r#"
            UPDATE currencies
            SET is_active = $1
            WHERE code = $2
            RETURNING
                code,
                name,
                symbol,
                is_active as "is_active!: bool",
                exchange_rate as "exchange_rate!: Decimal",
                last_updated_at as "last_updated_at!: DateTime<Utc>"
            "#,
            active,
            code
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(currency)
    }
}

// ============= Tests =============

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    #[test]
    fn test_currency_conversion() {
        let currency = Currency::new(
            "EUR".to_string(),
            "Euro".to_string(),
            "€".to_string(),
            dec!(1.2)
        );

        // Test conversion to USD
        let eur_amount = dec!(100);
        let usd_amount = currency.to_usd(eur_amount);
        assert_eq!(usd_amount, dec!(120));

        // Test conversion back to EUR
        let converted_back = currency.from_usd(usd_amount);
        assert_eq!(converted_back, eur_amount);
    }
}