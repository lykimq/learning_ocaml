//! Payment Method Service Module
//!
//! Handles business logic for payment methods

use anyhow::Result;
use super::payment_method::{UserPaymentMethod, PaymentMethodRepository};
use super::payment_method::PaymentMethod;
use reqwest::Client;
use std::env;
use serde_json::json;
use rust_decimal::Decimal;
use rust_decimal::prelude::*;
use serde::{Serialize, Deserialize};
use chrono::Utc;
use std::default::Default;

/// Service for handling payment method operations
pub struct PaymentMethodService {
    pub repository: PaymentMethodRepository,
    pub payment_provider: PaymentMethod,
}

#[derive(Debug)]
pub struct PaymentResponse {
    pub transaction_id: String,
    pub success: bool
}

#[derive(Debug, Deserialize)]
pub struct StripeCharge {
    pub id: String,
    pub status: String
}

impl PaymentMethodService {
    /// Creates a new PaymentMethodService instance
    pub fn new(repository: PaymentMethodRepository, payment_provider: PaymentMethod) -> Self {
        Self {
            repository,
            payment_provider,
        }
    }

    /// Creates a new payment method
    pub async fn create_payment_method(
        &self,
        mut payment_method: UserPaymentMethod,
        payment_token: String
    ) -> Result<UserPaymentMethod> {
        // Validate with payment provider
        let provider_details = PaymentMethod::validate_payment_method(&payment_token, payment_method.payment_type)
            .await?;

        // Update payment method with provider details
        payment_method.provider_payment_id = Some(provider_details.id);
        payment_method.last_four = provider_details.last_four;
        payment_method.card_brand = provider_details.card_brand;
        payment_method.expiry_date = provider_details.expiry_date;

        // If this is the user's first payment method, make it default
        let existing_methods = self.repository
            .get_user_payment_methods(payment_method.user_id)
            .await?;

        if existing_methods.is_empty() {
            payment_method.is_default = true;
        }

        // Save to database
        self.repository.create_payment_method(&payment_method).await
    }

    /// Store payment method
    pub async fn store_payment_method(&self, payment_method: PaymentMethod) -> Result<PaymentMethod> {

        let user_payment_method = UserPaymentMethod {
            id: Default::default(), // let database generate id
            user_id: payment_method.user_id.unwrap_or_default(),
            payment_type: payment_method.payment_type,
            provider_payment_id: Some(payment_method.id.clone()),
            last_four: payment_method.last_four.clone(),
            card_brand: payment_method.card_brand.clone(),
            expiry_date: payment_method.expiry_date.clone(),
            is_default: payment_method.is_default,
            is_active: true,
            ..Default::default()
        };

        self.repository.create_payment_method(&user_payment_method).await?;

        Ok(payment_method)

    }

    /// Gets all payment methods for a user
    pub async fn get_user_payment_methods(&self, user_id: i32) -> Result<Vec<UserPaymentMethod>> {
        self.repository.get_user_payment_methods(user_id).await
    }

    /// Gets a specific payment method
    pub async fn get_payment_method(&self, id: i32, user_id: i32) -> Result<Option<UserPaymentMethod>> {
        self.repository.get_payment_method(id, user_id).await
    }

    /// Sets a payment method as default
    pub async fn set_default_payment_method(&self, id: i32, user_id: i32) -> Result<UserPaymentMethod> {
        self.repository.set_default_payment_method(id, user_id).await
    }

    /// Deactivates a payment method
    pub async fn deactivate_payment_method(&self, id: i32, user_id: i32) -> Result<UserPaymentMethod> {
        // Get the payment method
        let payment_method = self.repository
            .get_payment_method(id, user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Payment method not found"))?;

        // If it's the default method, ensure there's another active method
        if payment_method.is_default {
            let active_methods = self.repository
                .get_user_payment_methods(user_id)
                .await?;

            if active_methods.len() <= 1 {
                return Err(anyhow::anyhow!(
                    "Cannot remove the only active payment method"
                ));
            }
        }

        // Deactivate with payment provider
        if let Some(provider_id) = &payment_method.provider_payment_id {
            PaymentMethod::deactivate_payment_method(provider_id)
                .await?;
        }

        // Deactivate in database
        self.repository.deactivate_payment_method(id, user_id).await
    }

    /// Validates a payment method with the provider
    pub async fn validate_payment_method(
        &self,
        id: i32,
        user_id: i32
    ) -> Result<bool> {
        let payment_method = self.repository
            .get_payment_method(id, user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Payment method not found"))?;

        if let Some(provider_id) = payment_method.provider_payment_id {
            PaymentMethod::validate_existing_payment_method(&provider_id)
                .await
        } else {
            Ok(false)
        }
    }

    /// Processes a payment
    pub async fn process_payment(&self, payment_token: &str, amount: Decimal) -> Result<PaymentResponse> {
        let client =   Client::new();
        // TODO: Get stripe key from env
        let stripe_key = env::var("STRIPE_SECRET_KEY")?;

        let response = client
            .post("https://api.stripe.com/v1/charges")
            .header("Authorization", format!("Bearer {}", stripe_key))
            .json(&json!({
                "amount": (amount * Decimal::from(100)).round().to_i64().unwrap(),
                "currency": "usd",
                "source": payment_token,
                "description": "Donation"
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to process payment"));
        }

        let charge: StripeCharge = response.json().await?;

        Ok(PaymentResponse {
            transaction_id: charge.id,
            success: charge.status == "succeeded"
          })

    }

}
