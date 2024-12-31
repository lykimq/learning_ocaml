//! Payment Method Module
//!
//! This module handles all payment method operations including:
//! - Payment method validation for different providers (Stripe, PayPal, etc.)
//! - Database operations for storing and managing payment methods
//! - Support for multiple payment types (credit/debit cards, PayPal, bank transfers, etc.)

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Type};
use anyhow::Result;
use std::str::FromStr;
use std::env;
use serde_json::json;
use reqwest::Client;

// ============= Types =============

/// Core payment method struct representing validated payment information
/// Used for storing the result of payment method validation before persistence
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaymentMethod {
    /// Unique identifier
    pub id: String,
    /// User ID
    pub user_id: Option<i32>,
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

// Provider-specific response types for parsing API responses
/// Stripe API response structures
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

/// PayPal authentication response
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

/// Payment Method Implementation
impl PaymentMethod {
    /// Factory method to create new PaymentMethod instances
    pub fn new(id: String, user_id: Option<i32>, payment_type: PaymentMethodType, last_four: Option<String>, expiry_date: Option<String>, card_brand: Option<String>, is_default: bool, created_at: DateTime<Utc>) -> Self {
        Self { id, user_id, payment_type, last_four, expiry_date, card_brand, is_default, created_at }
    }

    /// Converts a validated payment method to a UserPaymentMethod
    pub fn into_user_payment_method(self) -> UserPaymentMethod {
        UserPaymentMethod {
            id: Default::default(),
            user_id: self.user_id.unwrap_or_default(),
            payment_type: self.payment_type,
            provider_payment_id: Some(self.id.clone()),
            last_four: self.last_four.clone(),
            card_brand: self.card_brand.clone(),
            expiry_date: self.expiry_date.clone(),
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

    /// Validates payment methods across different providers
    /// Routes to specific validation methods based on payment type
    pub async fn validate_payment_method
    (token : &str, payment_type: PaymentMethodType) -> Result<PaymentMethod> {

        Ok (match payment_type {
            PaymentMethodType::CreditCard
            | PaymentMethodType::DebitCard => {
                Self::validate_card_payment(token).await?
            }
            PaymentMethodType::PayPal => {
                Self::validate_paypal_payment(token).await?
            }
            PaymentMethodType::BankTransfer => {
                Self::validate_bank_transfer_payment(token).await?
            }
            PaymentMethodType::Crypto => {
                Self::validate_crypto_payment(token).await?
            }
            PaymentMethodType::ApplePay  => {
                Self::validate_apple_pay_payment(token).await?
            }
            PaymentMethodType::GooglePay => {
                Self::validate_google_pay_payment(token).await?
            }
        })
    }


    /// Validates credit/debit card payments through Stripe
    /// Handles token validation and payment method creation
    async fn validate_card_payment(token : &str) -> Result<PaymentMethod> {
        let client = Client::new();
        // TODO: Get stripe key from env
            let stripe_key = env::var("STRIPE_SECRET_KEY")?;

            let response = client
                .post("https://api.stripe.com/v1/payment_methods")
                .header("Authorization", format!("Bearer {}", stripe_key))
                .json(&json!({
                    "type": "card",
                    "card[token]": token
                }))
                .send()
                .await?;

            if !response.status().is_success() {
                return Err(anyhow::anyhow!("Failed to validate card payment"));
            }

            let stripe_response: StripePaymentMethod = response.json().await?;

            Ok(PaymentMethod {
                id: stripe_response.id,
                user_id: None,
                payment_type: PaymentMethodType::CreditCard,
                last_four: Some(stripe_response.card.last4),
                expiry_date: Some(format!("{:02}/{:04}",
                stripe_response.card.exp_month, stripe_response.card.exp_year)),
                card_brand: Some(stripe_response.card.brand),
                is_default: false,
                created_at: Utc::now()
            })
    }

    // Validate PayPal payment
    async fn validate_paypal_payment(token : &str) -> Result<PaymentMethod> {

        let client = Client::new();
        // TODO: Get paypal key from env
        let paypal_client_id = env::var("PAYPAL_CLIENT_ID")?;
        let paypal_client_secret = env::var("PAYPAL_CLIENT_SECRET")?;

        // First get the access token
        let auth_response = client
            .post("https://api-m.sandbox.paypal.com/v1/oauth2/token")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .basic_auth(&paypal_client_id, Some(&paypal_client_secret))
            .body(format!("grant_type=client_credentials"))
            .send()
            .await?;

        let auth : PayPalAuth = auth_response.json().await?;

        // Validate the payment method

        let response = client
            .post("https://api-m.sandbox.paypal.com/v1/payments/payment")
            .bearer_auth(auth.access_token)
            .json(&serde_json::json!({
                "token": token,
                "validate_only": true
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to validate PayPal payment"));
        }

        Ok(PaymentMethod {
            id: "".to_string(),
            user_id: None,
            payment_type: PaymentMethodType::PayPal,
            last_four: None, // PayPal doesn't have a last 4
            expiry_date: None, // PayPal doesn't have an expiry date
            card_brand: None, // PayPal doesn't have a card brand
            is_default: false,
            created_at: Utc::now()
        })
    }


    // Validate bank transfer payment
    async fn validate_bank_transfer_payment(token : &str) -> Result<PaymentMethod> {

        let client = Client::new();

        let plaid_secret = env::var("PLAID_SECRET")?;
        let plaid_public_key = env::var("PLAID_PUBLIC_KEY")?;

        let response = client
            .post("https://sandbox.plaid.com/link/token/create")
            .header("PLAID_SECRET", plaid_secret)
            .header("PLAID_PUBLIC_KEY", plaid_public_key)
            .json(&serde_json::json!({
                "public_token": token,
                "account_id": "account_id" // TODO: Get account id from plaid
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to validate bank transfer payment"));
        }

        let plaid_response: PlaidPaymentMethod = response.json().await?;

        Ok(PaymentMethod {
            id: plaid_response.payment_id,
            user_id: None,
            payment_type: PaymentMethodType::BankTransfer,
            last_four: Some(plaid_response.account_last4),
            expiry_date: None,
            card_brand: None,
            is_default: false,
            created_at: Utc::now()
        })
    }


    // Validate apple pay payment
    async fn validate_apple_pay_payment(token : &str) -> Result<PaymentMethod> {

        let client = Client::new();
        // TODO: Get stripe key from env
        let stripe_key = env::var("STRIPE_SECRET_KEY")?;

        let response = client
            .post("https://api.stripe.com/v1/payment_methods")
            .header("Authorization", format!("Bearer {}", stripe_key))
            .json(&json!({
                "type": "apple_pay",
                "token": token
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to validate apple pay payment"));
        }

        let apple_pay_response: ApplePayResponse = response.json().await?;

        Ok(PaymentMethod {
            id: apple_pay_response.id,
            user_id: None,
            payment_type: PaymentMethodType::ApplePay,
            last_four: Some(apple_pay_response.card.last_four),
            expiry_date: Some(format!("{:02}/{:04}",
            apple_pay_response.card.expiry_month, apple_pay_response.card.expiry_year)),
            card_brand: Some("Apple Pay".to_string()),
            is_default: false,
            created_at: Utc::now()
        })
    }

    // Validate google pay payment
    async fn validate_google_pay_payment(token : &str) -> Result<PaymentMethod> {

        let client = Client::new();
        // TODO: Get stripe key from env
        let stripe_key = env::var("STRIPE_SECRET_KEY")?;

        let response = client
            .post("https://api.stripe.com/v1/payment_methods")
            .header("Authorization", format!("Bearer {}", stripe_key))
            .json(&json!({
                "type": "google_pay",
                "token": token
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to validate google pay payment"));
        }

        let google_pay_response: GooglePayResponse = response.json().await?;

        Ok(PaymentMethod {
            id: google_pay_response.id,
            user_id: None,
            payment_type: PaymentMethodType::GooglePay,
            last_four: Some(google_pay_response.card.last_four),
            expiry_date: Some(format!("{:02}/{:04}",
            google_pay_response.card.expiry_month, google_pay_response.card.expiry_year)),
            card_brand: Some("Google Pay".to_string()),
            is_default: false,
            created_at: Utc::now()
        })
    }


    // validate crypto payment
    async fn validate_crypto_payment(token : &str) -> Result<PaymentMethod> {
        // TODO: Implement crypto payment validation
        Ok(PaymentMethod {
            id: "".to_string(),
            user_id: None,
            payment_type: PaymentMethodType::Crypto,
            last_four: None,
            expiry_date: None,
            card_brand: None,
            is_default: false,
            created_at: Utc::now()
        })
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


/// Payment method types supported by the application
/// Maps to database enum type 'payment_method_type'
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

impl std::fmt::Display for PaymentMethodType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.to_string())
    }
}

impl FromStr for PaymentMethodType {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "credit_card" => Ok(Self::CreditCard),
            "debit_card" => Ok(Self::DebitCard),
            "bank_transfer" => Ok(Self::BankTransfer),
            "paypal" => Ok(Self::PayPal),
            _ => Err(anyhow::anyhow!("Invalid payment method: {}", s))
        }
    }
}

impl Default for PaymentMethodType {
    fn default() -> Self {
        Self::CreditCard
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
