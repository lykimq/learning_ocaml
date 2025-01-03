//! Currency and Donation Handlers Module
//!
//! This module provides HTTP endpoint handlers for:
//! - Recurring donation setup
//! - Currency exchange rate management
//! - Currency conversion operations
//!
//! All handlers integrate with CurrencyService and DonationService
//! for business logic processing.

use actix_web::{web, HttpResponse, Responder};
use serde_json::json;
use rust_decimal::Decimal;

use crate::user::AuthenticatedUser;
use crate::donation::{
    recurring_donation::RecurringDonation,
    currency_service::CurrencyService,
    donation_service::DonationService,
};

// ============= Recurring Donation Handlers =============

/// Creates a new recurring donation
///
/// # Endpoint: POST /api/donations/recurring
///
/// # Access
/// - Authenticated users only
///
/// # Parameters
/// * `donation_data` - Recurring donation details
/// * `payment_token` - Payment method token
/// * `user` - Authenticated user information
///
/// # Returns
/// * Success: Created recurring donation
/// * Error: 400 for invalid currency, 500 for processing errors
pub async fn create_recurring_donation(
    donation_service: web::Data<DonationService>,
    currency_service: web::Data<CurrencyService>,
    donation_data: web::Json<RecurringDonation>,
    payment_token: web::Header<String>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    // Validate currency code
    let currency_code = &donation_data.currency;
    if let Err(e) = currency_service.get_currency(currency_code).await {
        return HttpResponse::BadRequest().json(json!({
            "error": format!("Invalid currency code: {}", currency_code)
        }));
    }

    // Prepare donation with user information
    let mut recurring_donation = donation_data.into_inner();
    recurring_donation.user_id = user.id;

    // Process recurring donation setup
    match donation_service
        .setup_recurring_donation(recurring_donation, payment_token.into_inner())
        .await
    {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

// ============= Currency Management Handlers =============

/// Updates exchange rate for a specific currency
///
/// # Endpoint: PATCH /api/currencies/{code}/rate
///
/// # Access
/// - Admin only (enforced at router level)
///
/// # Parameters
/// * `code` - Currency code to update
/// * `new_rate` - New exchange rate value
///
/// # Returns
/// * Success: Updated currency information
/// * Error: 500 for processing errors
pub async fn update_exchange_rate(
    currency_service: web::Data<CurrencyService>,
    code: web::Path<String>,
    new_rate: web::Json<Decimal>
) -> impl Responder {
    let code = code.into_inner();
    let new_rate = new_rate.into_inner();

    match currency_service.update_exchange_rate(&code, new_rate).await {
        Ok(currency) => HttpResponse::Ok().json(currency),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Converts amount between currencies
///
/// # Endpoint: GET /api/currencies/convert/{from}/{to}/{amount}
///
/// # Access
/// - Public endpoint
///
/// # Parameters
/// * `amount` - Amount to convert
/// * `from_currency` - Source currency code
/// * `to_currency` - Target currency code
///
/// # Returns
/// * Success: Converted amount
/// * Error: 500 for conversion errors
pub async fn convert_amount(
    currency_service: web::Data<CurrencyService>,
    amount: web::Json<Decimal>,
    from_currency: web::Path<String>,
    to_currency: web::Path<String>
) -> impl Responder {
    let amount = amount.into_inner();
    let from_currency = from_currency.into_inner();
    let to_currency = to_currency.into_inner();

    match currency_service.convert_amount(amount, &from_currency, &to_currency).await {
        Ok(converted_amount) => HttpResponse::Ok().json(converted_amount),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

