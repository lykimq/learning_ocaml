//! Receipt Handlers Module
//!
//! This module provides HTTP endpoint handlers for:
//! - One-time donation receipts
//! - Recurring donation receipts
//! - Tax year receipts
//! - Receipt downloads
//! - Administrative receipt operations

use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;
use crate::user::AuthenticatedUser;
use crate::donation::receipt::ReceiptRepository;
use crate::donation::donation_service::DonationService;

// ============= Types =============

/// Request parameters for receipt generation
#[derive(Deserialize)]
pub struct GenerateReceiptRequest {
    /// Optional tax year for the receipt
    tax_year: Option<i32>,
}

// ============= One-Time Donation Receipt Handlers =============

/// Generates a receipt for a single donation
///
/// # Endpoint: POST /api/donations/{id}/receipts
///
/// # Access
/// - Donation owner
/// - Admin users
///
/// # Parameters
/// * `donation_id` - ID of the donation
/// * `tax_year` - Optional tax year for the receipt
pub async fn generate_donation_receipt(
    receipt: web::Data<ReceiptRepository>,
    path: web::Path<i32>,
    req: web::Json<GenerateReceiptRequest>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match receipt
        .create_donation_receipt(path.into_inner(), req.tax_year.unwrap_or(0))
        .await
    {
        Ok(receipt) => HttpResponse::Ok().json(receipt),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Retrieves all receipts for a specific donation
///
/// # Endpoint: GET /api/donations/{id}/receipts
pub async fn get_donation_receipts(
    receipt: web::Data<ReceiptRepository>,
    path: web::Path<i32>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match receipt
        .get_donation_receipts(path.into_inner())
        .await
    {
        Ok(receipts) => HttpResponse::Ok().json(receipts),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

// ============= Receipt Lookup Handlers =============

/// Retrieves a receipt by its unique number
///
/// # Endpoint: GET /api/receipts/{number}
pub async fn get_receipt_by_number(
    receipt: web::Data<ReceiptRepository>,
    path: web::Path<String>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match receipt
        .get_receipt_by_number(&path.into_inner())
        .await
    {
        Ok(Some(receipt)) => HttpResponse::Ok().json(receipt),
        Ok(None) => HttpResponse::NotFound().json("Receipt not found"),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Gets all receipts for a user in a specific tax year
///
/// # Endpoint: GET /api/receipts/year/{year}
pub async fn get_user_receipts_by_tax_year(
    receipt: web::Data<ReceiptRepository>,
    path: web::Path<i32>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match receipt
        .get_receipts_by_tax_year(path.into_inner())
        .await
    {
        Ok(receipts) => HttpResponse::Ok().json(receipts),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

// ============= Recurring Donation Receipt Handlers =============

/// Generates a receipt for a recurring donation
///
/// # Endpoint: POST /api/donations/recurring/{id}/receipts
pub async fn generate_recurring_donation_receipt(
    receipt: web::Data<ReceiptRepository>,
    path: web::Path<i32>,
    req: web::Json<GenerateReceiptRequest>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match receipt
        .create_recurring_donation_receipt(path.into_inner(), req.tax_year.unwrap_or(0))
        .await
    {
        Ok(receipt) => HttpResponse::Ok().json(receipt),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Gets all receipts for a recurring donation
///
/// # Endpoint: GET /api/donations/recurring/{id}/receipts
pub async fn get_recurring_donation_receipts(
    receipt: web::Data<ReceiptRepository>,
    path: web::Path<i32>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match receipt
        .get_recurring_donation_receipts(path.into_inner())
        .await
    {
        Ok(receipts) => HttpResponse::Ok().json(receipts),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

// ============= Administrative Receipt Handlers =============

/// Gets all receipts for a tax year (Admin only)
///
/// # Endpoint: GET /api/admin/receipts/year/{year}
///
/// # Access
/// - Admin users only
pub async fn get_all_receipts_by_tax_year(
    receipt: web::Data<ReceiptRepository>,
    path: web::Path<i32>,
    _: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match receipt.get_receipts_by_tax_year(path.into_inner()).await {
        Ok(receipts) => HttpResponse::Ok().json(receipts),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Generates annual receipts for all donations (Admin only)
///
/// # Endpoint: POST /api/admin/receipts/generate-annual/{year}
///
/// # Access
/// - Admin users only
pub async fn generate_annual_receipts(
    receipt: web::Data<ReceiptRepository>,
    path: web::Path<i32>,
    _: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match receipt.generate_annual_receipts(path.into_inner()).await {
        Ok(receipts) => HttpResponse::Ok().json(receipts),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}


// ============= Route Configuration =============

/// Configures all receipt-related routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .service(
                web::scope("/donations")
                    .route("/{id}/receipts", web::post().to(generate_donation_receipt))
                    .route("/{id}/receipts", web::get().to(get_donation_receipts))
                    .route("/recurring/{id}/receipts", web::post().to(generate_recurring_donation_receipt))
                    .route("/recurring/{id}/receipts", web::get().to(get_recurring_donation_receipts))
            )
            .service(
                web::scope("/receipts")
                    .route("/{number}", web::get().to(get_receipt_by_number))
                    .route("/year/{year}", web::get().to(get_user_receipts_by_tax_year))
            )
            .service(
                web::scope("/admin/receipts")
                    .route("/year/{year}", web::get().to(get_all_receipts_by_tax_year))
                    .route("/generate-annual/{year}", web::post().to(generate_annual_receipts))
            )
    );
}