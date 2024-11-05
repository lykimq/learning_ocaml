use sqlx::{PgPool, Error, FromRow};
use serde::{Deserialize, Serialize};
use actix_web::{web, HttpResponse, Responder};

#[derive(Serialize, Deserialize, FromRow)]  // Add FromRow here
pub struct User {
    pub id: i32,
    pub username: String,
    pub email: String,
}

#[derive(Deserialize)]
pub struct RegistrationInfo {
    pub username: String,
    pub email: String,
}

pub async fn register_user(pool: &PgPool, username: &str, email: &str) -> Result<User, Error> {
    // Check if the email already exists
    let existing_user: Option<User> = sqlx::query_as::<_, User>(
        r#"SELECT id, username, email FROM users WHERE email = $1"#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;

    if existing_user.is_some() {
        return Err(Error::RowNotFound); // or any custom error for user already exists
    }

    // Insert the new user
    let new_user = sqlx::query_as::<_, User>(
        r#"INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id, username, email"#,
    )
    .bind(username)
    .bind(email)
    .fetch_one(pool)
    .await?;

    Ok(new_user)
}

pub async fn register(
    info: web::Json<RegistrationInfo>,
    pool: web::Data<PgPool>
) -> impl Responder {
    match register_user(pool.get_ref(), &info.username, &info.email).await {
        Ok(user) => HttpResponse::Created().json(user),
        Err(_) => HttpResponse::BadRequest().body("Email already in use or invalid format"),
    }
}
