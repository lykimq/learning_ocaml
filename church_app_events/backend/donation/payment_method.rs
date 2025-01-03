//! Payment Method Module
//!
//! This module provides comprehensive payment method handling:
//! - Multiple payment provider support (Stripe, PayPal, etc.)
//! - Payment method validation
//! - Database operations
//! - Type-safe payment method management
//!
//! Supports various payment types including:
//! - Credit/debit cards
//! - PayPal
//! - Bank transfers
//! - Apple Pay
//! - Google Pay
//! - Cryptocurrency

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Type};
use anyhow::Result;
use std::env;
use serde_json::json;
use reqwest::Client;

// ============= Core Types =============

/// Represents a validated payment method
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaymentMethod {
    /// Unique identifier from payment provider
    pub id: String,
    /// Associated user ID (optional for initial validation)
    pub user_id: Option<i32>,
    /// Type of payment method
    pub payment_type: PaymentMethodType,
    /// Last 4 digits (for card-based methods)
    pub last_four: Option<String>,
    /// Expiration date (for card-based methods)
    pub expiry_date: Option<String>,
    /// Card brand (for card-based methods)
    pub card_brand: Option<String>,
    /// Whether this is the default payment method
    pub is_default: bool,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
}

/// Supported payment method types
#[derive(Debug, Serialize, Deserialize, Type, Clone, Copy, PartialEq)]
#[sqlx(type_name = "payment_method_type", rename_all = "lowercase")]
pub enum PaymentMethodType {
    CreditCard,
    DebitCard,
    PayPal,
    BankTransfer,
    Crypto,
    ApplePay,
    GooglePay,
}

impl Default for PaymentMethodType {
    fn default() -> Self {
        PaymentMethodType::CreditCard
    }
}

impl std::fmt::Display for PaymentMethodType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PaymentMethodType::CreditCard => write!(f, "credit_card"),
            PaymentMethodType::DebitCard => write!(f, "debit_card"),
            PaymentMethodType::PayPal => write!(f, "paypal"),
            PaymentMethodType::BankTransfer => write!(f, "bank_transfer"),
            PaymentMethodType::Crypto => write!(f, "crypto"),
            PaymentMethodType::ApplePay => write!(f, "apple_pay"),
            PaymentMethodType::GooglePay => write!(f, "google_pay"),
        }
    }
}

impl std::str::FromStr for PaymentMethodType {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "credit_card" => Ok(PaymentMethodType::CreditCard),
            "debit_card" => Ok(PaymentMethodType::DebitCard),
            "paypal" => Ok(PaymentMethodType::PayPal),
            "bank_transfer" => Ok(PaymentMethodType::BankTransfer),
            "crypto" => Ok(PaymentMethodType::Crypto),
            "apple_pay" => Ok(PaymentMethodType::ApplePay),
            "google_pay" => Ok(PaymentMethodType::GooglePay),
            _ => Err(anyhow::anyhow!("Invalid payment method type")),
        }
    }
}

// ============= Provider Response Types =============

#[derive(Deserialize)]
struct StripePaymentMethod {
    id: String,
    card: StripeCard,
}

#[derive(Deserialize)]
struct StripeCard {
    brand: String,
    last4: String,
    exp_month: u32,
    exp_year: u32,
}

#[derive(Deserialize)]
struct PayPalAuth {
    access_token: String,
}

#[derive(Deserialize)]
struct PlaidPaymentMethod {
    payment_id: String,
    account_last4: String
}

#[derive(Deserialize)]
struct ApplePayResponse {
    id: String,
    card: CardDetails,
}

#[derive(Deserialize)]
struct GooglePayResponse {
    id: String,
    card: CardDetails,
}

#[derive(Deserialize)]
struct CardDetails {
    last_four: String,
    expiry_month: u32,
    expiry_year: u32
}

// ============= Payment Method Implementation =============

impl PaymentMethod {
    /// Creates a new PaymentMethod instance
    pub fn new(
        id: String,
        user_id: Option<i32>,
        payment_type: PaymentMethodType,
        last_four: Option<String>,
        expiry_date: Option<String>,
        card_brand: Option<String>,
        is_default: bool,
        created_at: DateTime<Utc>
    ) -> Self {
        Self {
            id,
            user_id,
            payment_type,
            last_four,
            expiry_date,
            card_brand,
            is_default,
            created_at
        }
    }

    /// Converts to UserPaymentMethod for database storage
    pub fn into_user_payment_method(self) -> UserPaymentMethod {
        UserPaymentMethod {
            id: Default::default(),
            user_id: self.user_id.unwrap_or_default(),
            payment_type: self.payment_type,
            provider_payment_id: Some(self.id),
            last_four: self.last_four,
            card_brand: self.card_brand,
            expiry_date: self.expiry_date,
            is_default: self.is_default,
            is_active: true,
            billing_address_line1: None,
            billing_address_line2: None,
            billing_city: None,
            billing_state: None,
            billing_postal_code: None,
            billing_country: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    /// Validates payment method with appropriate provider
    pub async fn validate_payment_method(
        token: &str,
        payment_type: PaymentMethodType
    ) -> Result<PaymentMethod> {
        match payment_type {
            PaymentMethodType::CreditCard |
            PaymentMethodType::DebitCard => {
                Self::validate_card_payment(token).await
            }
            PaymentMethodType::PayPal => {
                Self::validate_paypal_payment(token).await
            }
            PaymentMethodType::BankTransfer => {
                Self::validate_bank_transfer_payment(token).await
            }
            PaymentMethodType::Crypto => {
                Self::validate_crypto_payment(token).await
            }
            PaymentMethodType::ApplePay => {
                Self::validate_apple_pay_payment(token).await
            }
            PaymentMethodType::GooglePay => {
                Self::validate_google_pay_payment(token).await
            }
        }
    }

    /// Validates credit/debit card payments through Stripe
    async fn validate_card_payment(token: &str) -> Result<PaymentMethod> {
        let client = Client::new();
        let stripe_key = env::var("STRIPE_SECRET_KEY")?;

        let response = client
            .post("https://api.stripe.com/v1/payment_methods")
            .header("Authorization", format!("Bearer {}", stripe_key))
            .form(&[("payment_method", token)])
            .send()
            .await?;

        let payment_method: StripePaymentMethod = response.json().await?;

        Ok(PaymentMethod::new(
            payment_method.id,
            None,
            PaymentMethodType::CreditCard,
            Some(payment_method.card.last4),
            Some(format!("{:02}/{}",
                payment_method.card.exp_month,
                payment_method.card.exp_year
            )),
            Some(payment_method.card.brand),
            false,
            Utc::now()
        ))
    }

    /// Validates PayPal payment tokens
    async fn validate_paypal_payment(token: &str) -> Result<PaymentMethod> {
        let client = Client::new();
        let paypal_client_id = env::var("PAYPAL_CLIENT_ID")?;
        let paypal_secret = env::var("PAYPAL_SECRET")?;

        // Get PayPal auth token
        let auth_response = client
            .post("https://api.paypal.com/v1/oauth2/token")
            .basic_auth(&paypal_client_id, Some(&paypal_secret))
            .form(&[("grant_type", "client_credentials")])
            .send()
            .await?;

        let auth: PayPalAuth = auth_response.json().await?;

        // Validate payment method
        let response = client
            .get(&format!("https://api.paypal.com/v1/payments/payment/{}", token))
            .bearer_auth(auth.access_token)
            .send()
            .await?;

        let payment_data = response.json::<serde_json::Value>().await?;

        Ok(PaymentMethod::new(
            token.to_string(),
            None,
            PaymentMethodType::PayPal,
            None,
            None,
            None,
            false,
            Utc::now()
        ))
    }

    /// Validates bank transfer payments through Plaid
    async fn validate_bank_transfer_payment(token: &str) -> Result<PaymentMethod> {
        let client = Client::new();
        let plaid_key = env::var("PLAID_SECRET_KEY")?;

        let response = client
            .post("https://api.plaid.com/payment_methods/get")
            .header("PLAID-CLIENT-ID", env::var("PLAID_CLIENT_ID")?)
            .header("PLAID-SECRET", plaid_key)
            .json(&json!({
                "payment_token": token
            }))
            .send()
            .await?;

        let payment: PlaidPaymentMethod = response.json().await?;

        Ok(PaymentMethod::new(
            payment.payment_id,
            None,
            PaymentMethodType::BankTransfer,
            Some(payment.account_last4),
            None,
            None,
            false,
            Utc::now()
        ))
    }

    /// Validates cryptocurrency payments
    async fn validate_crypto_payment(token: &str) -> Result<PaymentMethod> {
        // Implement crypto validation logic
        Ok(PaymentMethod::new(
            token.to_string(),
            None,
            PaymentMethodType::Crypto,
            None,
            None,
            None,
            false,
            Utc::now()
        ))
    }

    /// Validates Apple Pay payments
    async fn validate_apple_pay_payment(token: &str) -> Result<PaymentMethod> {
        let client = Client::new();
        let apple_pay_key = env::var("APPLE_PAY_SECRET_KEY")?;

        let response = client
            .post("https://api.apple.com/v1/payments/validate")
            .bearer_auth(apple_pay_key)
            .json(&json!({
                "token": token
            }))
            .send()
            .await?;

        let payment: ApplePayResponse = response.json().await?;

        Ok(PaymentMethod::new(
            payment.id,
            None,
            PaymentMethodType::ApplePay,
            Some(payment.card.last_four),
            Some(format!("{:02}/{}",
                payment.card.expiry_month,
                payment.card.expiry_year
            )),
            None,
            false,
            Utc::now()
        ))
    }

    /// Validates Google Pay payments
    async fn validate_google_pay_payment(token: &str) -> Result<PaymentMethod> {
        let client = Client::new();
        let google_pay_key = env::var("GOOGLE_PAY_SECRET_KEY")?;

        let response = client
            .post("https://payments.google.com/v1/payments/validate")
            .bearer_auth(google_pay_key)
            .json(&json!({
                "token": token
            }))
            .send()
            .await?;

        let payment: GooglePayResponse = response.json().await?;

        Ok(PaymentMethod::new(
            payment.id,
            None,
            PaymentMethodType::GooglePay,
            Some(payment.card.last_four),
            Some(format!("{:02}/{}",
                payment.card.expiry_month,
                payment.card.expiry_year
            )),
            None,
            false,
            Utc::now()
        ))
    }

    // Deactivate payment method
    pub async fn deactivate_payment_method(id : &str) -> Result<()> {
        let client = Client::new();
        // TODO: Get stripe key from env
        let stripe_key = env::var("STRIPE_SECRET_KEY")?;

        let response = client
            .post(format!("https://api.stripe.com/v1/payment_methods/{}/detach", id))
            .header("Authorization", format!("Bearer {}", stripe_key))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to deactivate payment method"));
        }

        Ok(())
    }

    // Validate existing payment method
    pub async fn validate_existing_payment_method(id : &str) -> Result<(bool)> {

        let client = Client::new();
        // TODO: Get stripe key from env
        let stripe_key = env::var("STRIPE_SECRET_KEY")?;

        let response = client
            .get(format!("https://api.stripe.com/v1/payment_methods/{}", id))
            .header("Authorization", format!("Bearer {}", stripe_key))
            .send()
            .await?;

        Ok(response.status().is_success())
    }

}


/// Database model for stored payment methods
/// Contains additional fields for user association and billing details
#[derive(Debug, Serialize, Deserialize, Default)]
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

/// Repository for database operations related to payment methods
/// Handles CRUD operations for user payment methods
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


    /// Retrieves all active payment methods for a specific user
    /// Orders by default status and creation date
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


    /// Sets a payment method as the default for a user
    /// Ensures only one default method exists per user
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

    /// Soft deletes a payment method by marking it as inactive
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
