use sqlx::{PgPool, Error, FromRow};
use serde::{Deserialize, Serialize};
use actix_web::{web, HttpResponse, Responder};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub email: String,
}

#[derive(sqlx::FromRow, Serialize)]
pub struct UserResponse {
    pub id: i32,
    pub username: String,
    pub email: String,
}

#[derive(Deserialize)]
pub struct RegistrationInfo {
    pub username: String,
    pub email: String,
}

// Function to check if an email already exists
async fn email_exists(pool: &PgPool, email: &str) -> Result<bool, Error> {
    let result = sqlx::query!("SELECT id FROM users WHERE email = $1", email)
        .fetch_optional(pool)
        .await?;
    Ok(result.is_some())
}

pub async fn register_user(
    pool: &PgPool,
    username: &str,
    email: &str,
) -> Result<UserResponse, String> {
    match email_exists(pool, email).await {
        Ok(true) => return Err("Email already exists".to_string()),
        Ok(false) => {}
        Err(err) => return Err(format!("Database error: {}", err)),
    }

    let new_user = sqlx::query!(
        "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id",
        username,
        email
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    println!("User registered successfully");

    Ok(UserResponse {
        id: new_user.id,
        username: username.to_string(),
        email: email.to_string(),
    })
}

pub async fn register_user_handler(
    pool: web::Data<PgPool>,
    user: web::Json<RegistrationInfo>, // Change User to RegistrationInfo
) -> impl Responder {
    match register_user(pool.get_ref(), &user.username, &user.email).await {
        Ok(_) => HttpResponse::Ok().json("User registered successfully."),
        Err(err) => HttpResponse::BadRequest().json(err),
    }
}

// Handler function to get all users with optional sorting
pub async fn get_all_users_handler(
    pool: web::Data<PgPool>,
    web::Query(sort_by): web::Query<HashMap<String, String>>,
) -> impl Responder {
    let mut query = "SELECT id, username, email FROM users".to_string();
    let mut sort_clause = String::new();

    // Check for sorting parameters
    if let Some(order) = sort_by.get("sort_by") {
        if order == "username" {
            sort_clause = " ORDER BY username".to_string();
        } else if order == "email" {
            sort_clause = " ORDER BY email".to_string();
        }
    }

    query.push_str(&sort_clause);
    let users: Vec<User> = sqlx::query_as::<_, User>(&query)
        .fetch_all(pool.get_ref())
        .await
        .unwrap_or_else(|_| Vec::new());

    HttpResponse::Ok().json(users)
}
