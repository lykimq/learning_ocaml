use actix_web::{web, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;

#[derive(Deserialize)]
pub struct LoginInfo {
    pub email: String,
    pub password: String,
}

pub async fn login(info: web::Json<LoginInfo>, pool: web::Data<PgPool>) -> HttpResponse {
    // Implement your login logic, checking against the database
    println!("Received login for: {}", info.email);
    HttpResponse::Ok().json("Login successful") // Replace with actual logic
}