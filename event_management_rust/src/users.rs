use actix_cors::Cors;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{Error, PgPool};

#[derive(Deserialize)]
pub struct User {
    pub username: String,
    pub email: String,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: i32,
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

// Handler function to get all users
pub async fn get_all_users_handler(pool: web::Data<PgPool>) -> impl Responder {
    let users = sqlx::query_as!(UserResponse, "SELECT id, username, email FROM users")
        .fetch_all(pool.get_ref())
        .await
        .unwrap_or_else(|_| Vec::new());

    HttpResponse::Ok().json(users)
}

// Function to create the HTTP server
pub async fn run_server(
    pool: PgPool,
    frontend_port: String,
    backend_port: u16,
) -> std::io::Result<()> {
    println!("Connected to the database");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(
                Cors::default()
                    .allowed_origin(&format!("http://localhost:{}", frontend_port))
                    .allowed_methods(vec!["POST", "GET", "OPTIONS"])
                    .allowed_headers(vec!["Content-Type", "Authorization"])
                    .max_age(3600),
            )
            .route("/register", web::post().to(register_user_handler))
            .route("/users", web::get().to(get_all_users_handler))
    })
    .bind(format!("127.0.0.1:{}", backend_port))?
    .run()
    .await
}
