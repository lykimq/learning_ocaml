use actix_web::{web, HttpResponse, Responder};
use bcrypt::{hash, verify, DEFAULT_COST};
use serde::{Deserialize, Serialize};
use sqlx::{Error, PgPool};

// Register

#[derive(sqlx::FromRow, Serialize)]
pub struct RegisterResponse {
    pub id: i32,
    pub username: String,
    is_admin: bool,
}

#[derive(Deserialize)]
pub struct RegisterInfo {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct LoginInfo {
    pub username: String,
    pub password: String,
}

async fn username_exists(pool: &PgPool, username: &str) -> Result<bool, Error> {
    let result = sqlx::query!("SELECT id FROM admins WHERE username = $1", username)
        .fetch_optional(pool)
        .await?;

    Ok(result.is_some())
}

pub async fn signup(
    pool: &PgPool,
    username: &str,
    password: &str,
) -> Result<RegisterResponse, String> {
    match username_exists(pool, username).await {
        Ok(true) => return Err("Username already exists".to_string()),
        Ok(false) => {}
        Err(err) => return Err(format!("Database error: {}", err)),
    }

    // Hash the password before storing it in the database
    let hashed_password = match hash(password, DEFAULT_COST) {
        Ok(hash) => hash,
        Err(_) => return Err("Failed to hash password".to_string()),
    };

    // Insert the new admin into the database
    let result = sqlx::query!(
        "INSERT INTO admins (username, password, is_admin) VALUES ($1, $2, $3) RETURNING id, username, is_admin",
        username,
        hashed_password,
        true
    )
    .fetch_one(pool)
    .await;

    println!("User registered login successfully.");

    match result {
        Ok(row) => Ok(RegisterResponse {
            id: row.id,
            username: username.to_string(),
            is_admin: row.is_admin,
        }),
        Err(err) => Err(format!("Database error: {}", err)),
    }
}

pub async fn signup_handler(
    pool: web::Data<PgPool>,
    user: web::Json<RegisterInfo>,
) -> impl Responder {
    match signup(pool.get_ref(), &user.username, &user.password).await {
        Ok(response) => HttpResponse::Created().json(response),
        Err(err) => HttpResponse::BadRequest().json(err),
    }
}

async fn validate_login(
    pool: &PgPool,
    username: &str,
    password: &str,
) -> Result<Option<bool>, Error> {
    // Query the admins table to find the user by username
    let row = sqlx::query!(
        "SELECT id, password, is_admin FROM admins WHERE username = $1",
        username
    )
    .fetch_optional(pool)
    .await?;

    match row {
        Some(user) => {
            // verify if the hashed password from DB matches the provided password
            if verify(password, &user.password).unwrap_or(false) {
                // Update the is_admin field to true if not already set
                if !user.is_admin {
                    sqlx::query!("UPDATE admins SET is_admin = true WHERE id = $1", user.id)
                        .execute(pool)
                        .await?;
                }

                // Return is_admin status after potential update
                Ok(Some(true))
            } else {
                Ok(None)
            }
        }
        None => Ok(None),
    }
}

// Login handle function
pub async fn login_handler(
    pool: web::Data<PgPool>,
    credentials: web::Json<LoginInfo>,
) -> impl Responder {
    let username = &credentials.username;
    let password = &credentials.password;

    match validate_login(pool.get_ref(), username, password).await {
        Ok(Some(is_admin)) => HttpResponse::Ok()
            .json(serde_json::json!({ "message": "Login successful." , "isAdmin": is_admin})),
        Ok(None) => HttpResponse::Unauthorized().json("Invalid username or password"),
        Err(err) => HttpResponse::InternalServerError().json(format!("Database error:{}", err)),
    }
}
