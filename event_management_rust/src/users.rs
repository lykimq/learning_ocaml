use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{Error, PgPool};
use std::collections::HashMap;

#[derive(Deserialize)]
pub struct User {
    pub username: String,
    pub email: String,
}

#[derive(sqlx::FromRow, Serialize)] // Ensure this derives FromRow for mapping
pub struct UserResponse {
    pub id: i32,
    pub username: String,
    pub email: String,
}

#[derive(Deserialize)]
pub struct UpdateUser {
    pub username: String,
    pub email: String,
}

// Function to check if an email already exists
pub async fn email_exists(pool: &PgPool, email: &str) -> Result<bool, Error> {
    let result = sqlx::query!("SELECT id FROM users WHERE email = $1", email)
        .fetch_optional(pool)
        .await?;
    Ok(result.is_some())
}

// Function to register a new user
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

// Handler function for user registration
pub async fn register_user_handler(
    pool: web::Data<PgPool>,
    user: web::Json<User>,
) -> impl Responder {
    match register_user(pool.get_ref(), &user.username, &user.email).await {
        Ok(_) => HttpResponse::Ok().json("User registered successfully."),
        Err(err) => HttpResponse::BadRequest().json(err),
    }
}

// Update the handler function to accept query parameters for sorting
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
    // Use sqlx::query_as! for direct mapping to UserResponse
    let users: Vec<UserResponse> = sqlx::query_as::<_, UserResponse>(&query)
        .fetch_all(pool.get_ref())
        .await
        .unwrap_or_else(|_| Vec::new());

    HttpResponse::Ok().json(users)
}

// Handler function to update a user
pub async fn update_user_handler(
    pool: web::Data<PgPool>,
    user_id: web::Path<i32>,
    updated_user: web::Json<UpdateUser>,
) -> impl Responder {
    let user_id = user_id.into_inner();
    match update_user(
        pool.get_ref(),
        user_id,
        &updated_user.username,
        &updated_user.email,
    )
    .await
    {
        Ok(_) => HttpResponse::Ok().json("User updated successfully."),
        Err(_) => HttpResponse::BadRequest().json("Failed to update user."),
    }
}

//Function to update a user in the database
async fn update_user(pool: &PgPool, id: i32, username: &str, email: &str) -> Result<(), Error> {
    sqlx::query!(
        "UPDATE users SET username = $1, email = $2 WHERE id = $3",
        username,
        email,
        id
    )
    .execute(pool)
    .await?;
    Ok(())
}

//Handler function to delete a user
pub async fn delete_user_handler(
    pool: web::Data<PgPool>,
    user_id: web::Path<i32>,
) -> impl Responder {
    let user_id = user_id.into_inner();
    match delete_user(pool.get_ref(), user_id).await {
        Ok(_) => HttpResponse::Ok().json("User deleted successfully."),
        Err(_) => HttpResponse::BadRequest().json("Failed to delete user."),
    }
}

//Function to delete a user from the database
async fn delete_user(pool: &PgPool, id: i32) -> Result<(), Error> {
    sqlx::query!("DELETE FROM users WHERE id = $1", id)
        .execute(pool)
        .await?;
    Ok(())
}
