//! Payment Method Handlers
//!
//! This module handles HTTP requests for payment method operations including:
//! - Creation and storage of payment methods
//! - Retrieval of payment methods
//! - Payment processing
//! - Payment method management (validation, deactivation, default settings)

use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;
use crate::user::AuthenticatedUser;
use crate::donation::{
    payment_method_service::PaymentMethodService,
    payment_method::PaymentMethod
};
use rust_decimal::Decimal;

#[derive(Deserialize)]
pub struct PaymentMethodRequest {
    payment_method: PaymentMethod,
    payment_token: String,
    amount: Decimal
}

// SECTION: Creation and Storage Operations

/// Creates a new payment method and associates it with the authenticated user
pub async fn create_payment_method(
    payment_service: web::Data<PaymentMethodService>,
    req: web::Json<PaymentMethodRequest>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    let mut payment_method = req.payment_method.clone();
    payment_method.user_id = Some(user.id);

    match payment_service
        .create_payment_method(payment_method.into_user_payment_method(), req.payment_token.clone())
        .await
    {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Stores a payment method for future use
/// Note: This differs from create_payment_method as it's specifically for storing
/// payment methods without immediate processing
pub async fn store_payment_method(
    payment_service: web::Data<PaymentMethodService>,
    req: web::Json<PaymentMethodRequest>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    let req = req.into_inner();
    let mut payment_method = req.payment_method;
    payment_method.user_id = Some(user.id);

    match payment_service.store_payment_method(payment_method, &req.payment_token).await {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

// SECTION: Retrieval Operations

/// Gets all payment methods for the authenticated user
pub async fn get_payment_methods(
    payment_service: web::Data<PaymentMethodService>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match payment_service.get_user_payment_methods(user.id).await {
        Ok(methods) => HttpResponse::Ok().json(methods),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Gets a specific payment method by ID
/// Returns 404 if the payment method is not found
pub async fn get_payment_method(
    payment_service: web::Data<PaymentMethodService>,
    path: web::Path<i32>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match payment_service.get_payment_method(path.into_inner(), user.id).await {
        Ok(Some(method)) => HttpResponse::Ok().json(method),
        Ok(None) => HttpResponse::NotFound().json("Payment method not found"),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Gets all payment methods associated with a specific user
/// Note: This is a duplicate of get_payment_methods and should be removed
pub async fn get_user_payment_methods(
    payment_service: web::Data<PaymentMethodService>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match payment_service.get_user_payment_methods(user.id).await {
        Ok(methods) => HttpResponse::Ok().json(methods),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

// SECTION: Payment Processing

/// Processes a payment using the provided payment token and amount
pub async fn process_payment(
    payment_service: web::Data<PaymentMethodService>,
    req: web::Json<PaymentMethodRequest>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match payment_service.process_payment(&req.payment_token, req.amount).await {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

// SECTION: Management Operations

/// Sets a payment method as the default for the user
pub async fn set_default_payment_method(
    payment_service: web::Data<PaymentMethodService>,
    path: web::Path<i32>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match payment_service
        .set_default_payment_method(path.into_inner(), user.id)
        .await
    {
        Ok(method) => HttpResponse::Ok().json(method),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Deactivates a payment method
/// This is preferred over deletion to maintain payment history
pub async fn deactivate_payment_method(
    payment_service: web::Data<PaymentMethodService>,
    path: web::Path<i32>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match payment_service
        .deactivate_payment_method(path.into_inner(), user.id)
        .await
    {
        Ok(method) => HttpResponse::Ok().json(method),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}

/// Validates a payment method
/// Returns a boolean indicating if the payment method is valid
pub async fn validate_payment_method(
    payment_service: web::Data<PaymentMethodService>,
    path: web::Path<i32>,
    user: web::ReqData<AuthenticatedUser>
) -> impl Responder {
    match payment_service
        .validate_payment_method(path.into_inner(), user.id)
        .await
    {
        Ok(is_valid) => HttpResponse::Ok().json(serde_json::json!({
            "is_valid": is_valid
        })),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string())
    }
}





