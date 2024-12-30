//! Payment Method Module
//!
//! Handles user payment methods and related operations

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Type};
use anyhow::Result;

// ============= Types =============

/// Payment method information
///
/// Stores payment method details for recurring donations.
#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentMethod {
    /// Unique identifier
    pub id: String,
    /// Type of payment method
    pub payment_type: PaymentMethodType,
    /// Last 4 digits (for cards)
    pub last_four: Option<String>,
    /// Expiry date (for cards)
    pub expiry_date: Option<String>,
    /// Card brand (for cards)
    pub card_brand: Option<String>,
    /// Whether this is the default payment method
    pub is_default: bool,
    /// When the payment method was created
    pub created_at: DateTime<Utc>,
}

/// Types of payment methods
///
/// Supported payment methods for donations.
#[derive(Debug, Serialize, Deserialize, Type, Clone, Copy)]
#[sqlx(type_name = "payment_method_type", rename_all = "lowercase")]
pub enum PaymentMethodType {
    /// Credit card payment
    CreditCard,
    /// Debit card payment
    DebitCard,
    /// PayPal payment
    PayPal,
    /// Direct bank transfer
    BankTransfer,
    /// Cryptocurrency payment
    Crypto,
    /// Apple Pay
    ApplePay,
    /// Google Pay
    GooglePay,
}

/// Represents a user's payment method
#[derive(Debug, Serialize, Deserialize)]
pub struct UserPaymentMethod {
    /// Unique identifier
    pub id: i32,
    /// Associated user ID
    pub user_id: i32,
    /// Type of payment method
    pub payment_type: PaymentMethodType,
    /// Payment provider's ID for this method
    pub provider_payment_id: Option<String>,
    /// Last 4 digits (for cards)
    pub last_four: Option<String>,
    /// Expiry date in MM/YYYY format
    pub expiry_date: Option<String>,
    /// Card brand (e.g., Visa, Mastercard)
    pub card_brand: Option<String>,
    /// Whether this is the default payment method
    pub is_default: bool,
    /// Whether the payment method is active
    pub is_active: bool,
    /// Billing address details
    pub billing_address_line1: Option<String>,
    pub billing_address_line2: Option<String>,
    pub billing_city: Option<String>,
    pub billing_state: Option<String>,
    pub billing_postal_code: Option<String>,
    pub billing_country: Option<String>,
    /// When the payment method was created
    pub created_at: DateTime<Utc>,
    /// When the payment method was last updated
    pub updated_at: DateTime<Utc>,
}

/// Billing address information
#[derive(Debug, Serialize, Deserialize)]
pub struct BillingAddress {
    pub line1: Option<String>,
    pub line2: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
}

/// Repository for payment method operations
pub struct PaymentMethodRepository {
    pool: PgPool,
}

// ============= Implementation =============

impl PaymentMethodRepository {
    /// Creates a new PaymentMethodRepository instance
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Creates a new payment method
    pub async fn create_payment_method(
        &self,
        payment_method: &UserPaymentMethod
    ) -> Result<UserPaymentMethod> {
        let result = sqlx::query_as!(
            UserPaymentMethod,
            r#"
            INSERT INTO user_payment_methods (
                user_id, payment_type, provider_payment_id, last_four,
                expiry_date, card_brand, is_default, is_active,
                billing_address_line1, billing_address_line2,
                billing_city, billing_state, billing_postal_code,
                billing_country
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING
                id, user_id, payment_type as "payment_type!: PaymentMethodType",
                provider_payment_id, last_four, expiry_date, card_brand,
                is_default as "is_default!: bool",
                is_active as "is_active!: bool",
                billing_address_line1,
                billing_address_line2,
                billing_city as "billing_city",
                billing_state as "billing_state",
                billing_postal_code as "billing_postal_code",
                billing_country as "billing_country",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>"
            "#,
            payment_method.user_id,
            payment_method.payment_type as PaymentMethodType,
            payment_method.provider_payment_id,
            payment_method.last_four,
            payment_method.expiry_date,
            payment_method.card_brand,
            payment_method.is_default,
            payment_method.is_active,
            payment_method.billing_address_line1,
            payment_method.billing_address_line2,
            payment_method.billing_city,
            payment_method.billing_state,
            payment_method.billing_postal_code,
            payment_method.billing_country,
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result)
    }

    /// Gets all payment methods for a user
    pub async fn get_user_payment_methods(
        &self,
        user_id: i32
    ) -> Result<Vec<UserPaymentMethod>> {
        let methods = sqlx::query_as!(
            UserPaymentMethod,
            r#"
            SELECT
                id, user_id, payment_type as "payment_type: PaymentMethodType",
                provider_payment_id, last_four, expiry_date, card_brand,
                is_default as "is_default!: bool",
                is_active as "is_active!: bool",
                billing_address_line1 as "billing_address_line1",
                billing_address_line2 as "billing_address_line2",
                billing_city as "billing_city",
                billing_state as "billing_state",
                billing_postal_code as "billing_postal_code",
                billing_country as "billing_country",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>"
            FROM user_payment_methods
            WHERE user_id = $1 AND is_active = true
            ORDER BY is_default DESC, created_at DESC
            "#,
            user_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(methods)
    }

    /// Gets a specific payment method
    pub async fn get_payment_method(
        &self,
        id: i32,
        user_id: i32
    ) -> Result<Option<UserPaymentMethod>> {
        let method = sqlx::query_as!(
            UserPaymentMethod,
            r#"
            SELECT
                id, user_id, payment_type as "payment_type: PaymentMethodType",
                provider_payment_id, last_four, expiry_date, card_brand,
                is_default as "is_default!: bool",
                is_active as "is_active!: bool",
                billing_address_line1 as "billing_address_line1",
                billing_address_line2 as "billing_address_line2",
                billing_city as "billing_city",
                billing_state as "billing_state",
                billing_postal_code as "billing_postal_code",
                billing_country as "billing_country",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>"
            FROM user_payment_methods
            WHERE id = $1 AND user_id = $2 AND is_active = true
            "#,
            id,
            user_id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(method)
    }

    /// Sets a payment method as default
    pub async fn set_default_payment_method(
        &self,
        id: i32,
        user_id: i32
    ) -> Result<UserPaymentMethod> {
        let method = sqlx::query_as!(
            UserPaymentMethod,
            r#"
            WITH updated AS (
                UPDATE user_payment_methods
                SET is_default = false
                WHERE user_id = $1 AND id != $2
            )
            UPDATE user_payment_methods
            SET is_default = true
            WHERE id = $2 AND user_id = $1
            RETURNING
                id, user_id, payment_type as "payment_type!: PaymentMethodType",
                provider_payment_id, last_four, expiry_date, card_brand,
                is_default as "is_default!: bool",
                is_active as "is_active!: bool",
                billing_address_line1 as "billing_address_line1",
                billing_address_line2 as "billing_address_line2",
                billing_city as "billing_city",
                billing_state as "billing_state",
                billing_postal_code as "billing_postal_code",
                billing_country as "billing_country",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>"
            "#,
            user_id,
            id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(method)
    }

    /// Deactivates a payment method
    pub async fn deactivate_payment_method(
        &self,
        id: i32,
        user_id: i32
    ) -> Result<UserPaymentMethod> {
        let method = sqlx::query_as!(
            UserPaymentMethod,
            r#"
            UPDATE user_payment_methods
            SET is_active = false
            WHERE id = $1 AND user_id = $2
            RETURNING
                id, user_id, payment_type as "payment_type: PaymentMethodType",
                provider_payment_id, last_four, expiry_date, card_brand,
                is_default as "is_default!: bool",
                is_active as "is_active!: bool",
                billing_address_line1 as "billing_address_line1",
                billing_address_line2 as "billing_address_line2",
                billing_city as "billing_city",
                billing_state as "billing_state",
                billing_postal_code as "billing_postal_code",
                billing_country as "billing_country",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>"
            "#,
            id,
            user_id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(method)
    }
}
