//! Currency Module
//!
//! Handles currency-related operations including:
//! - Currency validation
//! - Exchange rate management
//! - Currency conversion
//! - Database operations

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use anyhow::Result;

// ============= Types =============

/// Represents a currency in the system
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Currency {
    /// ISO 4217 currency code (e.g., USD, EUR)
    pub code: String,
    /// Full name of the currency
    pub name: String,
    /// Currency symbol (e.g., $, €)
    pub symbol: String,
    /// Whether the currency is currently active
    pub is_active: bool,
    /// Exchange rate relative to USD
    pub exchange_rate: Decimal,
    /// When the exchange rate was last updated
    pub last_updated_at: DateTime<Utc>,
}

/// Repository for currency operations
pub struct CurrencyRepository {
    pool: PgPool,
}

// ============= Implementation =============

impl Currency {
    /// Creates a new currency instance
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
            is_active: true,
            exchange_rate,
            last_updated_at: Utc::now(),
        }
    }

    /// Converts an amount from this currency to USD
    pub fn to_usd(&self, amount: Decimal) -> Decimal {
        amount * self.exchange_rate
    }

    /// Converts an amount from USD to this currency
    pub fn from_usd(&self, amount: Decimal) -> Decimal {
        amount / self.exchange_rate
    }
}

impl CurrencyRepository {
    /// Creates a new CurrencyRepository instance
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Gets a currency by its code
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

    /// Gets all active currencies
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

    /// Updates the exchange rate for a currency
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

    /// Creates a new currency
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

        let eur_amount = dec!(100);
        let usd_amount = currency.to_usd(eur_amount);
        assert_eq!(usd_amount, dec!(120));

        let converted_back = currency.from_usd(usd_amount);
        assert_eq!(converted_back, eur_amount);
    }
}