//! Donation Handlers Module
//!
//! This module provides HTTP endpoint handlers for:
//! - One-time donations
//! - Recurring donations
//! - Donation history and statistics
//! - Status management
//!
//! All handlers integrate with DonationService and CurrencyService
//! for business logic processing.

use actix_web::{web, HttpResponse, Responder};
use serde_json::json;
use crate::user::AuthenticatedUser;
use crate::donation::donation_service::DonationService;
use crate::donation::donation::{Donation, DonationStatus};
use crate::donation::currency_service::CurrencyService;


// ============= One-Time Donation Handlers =============

/// Creates a new one-time donation
///
/// # Endpoint: POST /api/donations
///
/// # Access
/// - Public endpoint (allows anonymous donations)
/// - Authenticated users get donations linked to their account
///
/// # Parameters
/// - donation_data: Donation details
/// - payment_token: Payment processing token
/// - user: Optional authenticated user
pub async fn create_donation(
    donation_service: web::Data<DonationService>,
    currency_service: web::Data<CurrencyService>,
    donation_data: web::Json<Donation>,
    payment_token: web::Header<String>,
    user: Option<web::ReqData<AuthenticatedUser>>
) -> impl Responder {
    // Validate currency
    let currency_code = &donation_data.currency;
    if let Err(e) = currency_service.get_currency(currency_code).await {
        return HttpResponse::BadRequest().json(json!({
            "error": format!("Invalid currency code: {}", currency_code)
        }));
    }

    // Prepare donation with user info if authenticated
    let mut donation = donation_data.into_inner();
    if let Some(auth_user) = user {
        donation.user_id = Some(auth_user.id);
    }

    // Process donation
    match donation_service
        .process_donation(donation, payment_token.into_inner())
        .await
    {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Retrieves details of a specific donation
///
/// # Endpoint: GET /api/donations/{id}
///
/// # Access
/// - Authenticated users can only view their own donations
/// - Admins can view all donations
pub async fn get_donation(
    donation_service: web::Data<DonationService>,
    donation_id: web::Path<i32>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match donation_service.get_donation(donation_id.into_inner()).await {
        Ok(donation) => {
            // Verify access rights
            if !user.is_admin && donation.user_id != Some(user.id) {
                return HttpResponse::Forbidden().json("Forbidden");
            }
            HttpResponse::Ok().json(donation)
        },
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

// ============= Donation History and Statistics =============

/// Retrieves donation history for authenticated user
///
/// # Endpoint: GET /api/donations/history
///
/// # Access
/// - Authenticated users only
pub async fn get_donation_history(
    donation_service: web::Data<DonationService>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match donation_service.get_user_donation_history(user.id).await {
        Ok(donations) => HttpResponse::Ok().json(donations),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Retrieves donation statistics
///
/// # Endpoint: GET /api/donations/statistics
///
/// # Access
/// - Admin only
pub async fn get_donation_statistics(
    donation_service: web::Data<DonationService>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    if !user.is_admin {
        return HttpResponse::Forbidden().json("Forbidden");
    }

    match donation_service.get_donation_statistics().await {
        Ok(statistics) => HttpResponse::Ok().json(statistics),
            Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

// ============= Recurring Donation Handlers =============

/// Updates status of a recurring donation
///
/// # Endpoint: PATCH /api/donations/recurring/{id}/status
///
/// # Access
/// - Donation owner
/// - Admin
pub async fn update_recurring_donation_status(
    donation_service: web::Data<DonationService>,
    donation_id: web::Path<i32>,
    status: web::Json<DonationStatus>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    let donation_id = donation_id.into_inner();

    // Verify ownership and existence
    match donation_service.get_recurring_donation(donation_id).await {
        Ok(donation) => {
            if donation.user_id != user.id && !user.is_admin {
                return HttpResponse::Forbidden().json("Forbidden");
            }
        },
        Err(_) => return HttpResponse::NotFound().json("Recurring donation not found")
    }

    // Update status
    match donation_service
        .update_recurring_donation_status(donation_id, status.into_inner())
        .await
    {
        Ok(donation) => HttpResponse::Ok().json(donation),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Cancels a recurring donation
///
/// # Endpoint: POST /api/donations/recurring/{id}/cancel
///
/// # Access
/// - Donation owner
/// - Admin
pub async fn cancel_recurring_donation(
    donation_service: web::Data<DonationService>,
    donation_id: web::Path<i32>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    // Verify donation exists and check access rights
    let donation = match donation_service.get_recurring_donation(donation_id.into_inner()).await {
        Ok(d) => d,
        Err(_) => return HttpResponse::NotFound().json("Recurring donation not found")
    };

    if donation.user_id != user.id && !user.is_admin {
        return HttpResponse::Forbidden().json("Forbidden");
    }

    // Process cancellation
    match donation_service.cancel_scheduled_payments(&donation).await {
        Ok(_) => HttpResponse::Ok().json(json!({
            "message": "Recurring donation cancelled successfully"
        })),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Retrieves history of a recurring donation
///
/// # Endpoint: GET /api/donations/recurring/{id}/history
///
/// # Access
/// - Donation owner
/// - Admin
pub async fn get_recurring_donation_history(
    donation_service: web::Data<DonationService>,
    donation_id: web::Path<i32>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match donation_service.get_recurring_donation(donation_id.into_inner()).await {
        Ok(recurring_donation) => {
            // Verify access rights using first donation
            if recurring_donation.user_id != user.id && !user.is_admin {
                    return HttpResponse::Forbidden().json("Forbidden");
            }
            HttpResponse::Ok().json(recurring_donation)
        },
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

// ============= Route Configuration =============

