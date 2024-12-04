use actix_web::{
    web,
    HttpResponse,
    Responder,
    HttpRequest,
    body::MessageBody

};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, QueryBuilder};
use serde_json::json;
use regex::Regex;
use lazy_static::lazy_static;
use bcrypt;
use jsonwebtoken::{encode, decode, Header, EncodingKey, DecodingKey, Validation};
use actix_web::dev::{Service, ServiceRequest, ServiceResponse, Transform};
use actix_web::Error;
use futures::future::{ok, Ready};
use std::task::{Context, Poll};
use dotenv::dotenv;
use chrono::{Utc, Duration as ChronoDuration};
use std::sync::Mutex;
use std::collections::HashSet;

lazy_static! {
    static ref EMAIL_REGEX: Regex =
    Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
    static ref USERNAME_REGEX: Regex =
    Regex::new(r"^[a-zA-Z0-9_-]{3,20}$").unwrap();
    static ref TOKEN_BLACKLIST: Mutex<HashSet<String>> = Mutex::new(HashSet::new());
}

#[derive(Debug, Deserialize, Serialize, Clone, Copy, sqlx::Type, PartialEq)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    User,
    Guest
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::Admin => write!(f, "admin"),
            UserRole::User => write!(f, "user"),
            UserRole::Guest => write!(f, "guest"),
        }
    }
}

impl std::str::FromStr for UserRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "admin" => Ok(UserRole::Admin),
            "user" => Ok(UserRole::User),
            "guest" => Ok(UserRole::Guest),
            _ => Err(format!("Invalid role: {}", s))
        }
    }
}

#[derive(Deserialize, Serialize, sqlx::FromRow, Debug)]
pub struct User {
    pub id: i32,
    pub email: String,
    pub password_hash: String,
    pub username: String,
    pub role: UserRole,
    pub profile_picture: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Deserialize, Debug)]
pub struct CreateUserData {
    pub email: String,
    pub password: String,
    pub username: String,
    pub role: UserRole,
    pub profile_picture: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateUserData {
    pub email: Option<String>,
    pub password: Option<String>,
    pub username: Option<String>,
    pub profile_picture: Option<String>,
}

#[derive(Deserialize)]
pub struct SearchUserParams {
    pub email: Option<String>,
    pub username: Option<String>,
    pub role: Option<UserRole>,
}

#[derive(Deserialize)]
pub struct VerifyPasswordRequest {
    pub identifier: String,  // Can be email or username
    pub password: String,
}

#[derive(Serialize)]
pub struct VerifyPasswordResponse {
    pub valid: bool,
    pub user: Option<User>,
}


#[derive(Serialize, Deserialize, Debug)]
pub struct LoginResponse {
    pub token: String,
    pub user: User,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct LoginRequest {
    pub identifier: String,
    pub password: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Claims {
    // Standard JWT claims
    pub sub: i32, // subject: User ID
    pub exp: usize, // expiration: Expiration time
    pub iat: usize, // issued at: Issued at time
    // Custom claims
    pub role: UserRole,
    pub email: String,
    pub username: String,
}

// Login handler
pub async fn login(
    pool: web::Data<PgPool>,
    request: web::Json<LoginRequest>
) -> impl Responder {
    // Find user by email or username
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT id, email, password_hash, username, role as "role!: UserRole",
        profile_picture, created_at, updated_at
        FROM users
        WHERE email = $1 OR username = $1"#,
        request.identifier
    )
    .fetch_optional(pool.get_ref())
    .await;

    match user {
        Ok(Some(user)) => {
            // Verify password
            let is_valid = bcrypt::verify(&request.password, &user.password_hash)
                .unwrap_or(false);
            if !is_valid {
                return HttpResponse::Unauthorized().json(json!({
                    "message": "Invalid password"
                }));
            }

            // Current time
            let now = Utc::now();

            // Generate JWT
            let expiration = now.checked_add_signed(ChronoDuration::hours(24))
                .expect("Invalid timestamp")
                .timestamp() as usize; // 1 day expiration


            let issued_at = now.timestamp() as usize; // Issued at time

            // Create claims for JWT
            let claims = Claims {
                sub: user.id,
                exp: expiration,
                iat: issued_at,
                role: user.role,
                email: user.email.clone(),
                username: user.username.clone(),
            };

            // Create JWT header and payload
            let header = Header::new(jsonwebtoken::Algorithm::HS256);

            // Generate JWT Token
            let secret = std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| {
                dotenv().ok();
                std::env::var("JWT_SECRET").expect("JWT_SECRET must be set")
            });

            match encode(
                &header,
                &claims,
                &EncodingKey::from_secret(secret.as_bytes())
            ) {
                Ok(token) =>
                {
                    // Create response
                    let response = json!({
                        "token": token,
                        "token_type": "Bearer",
                        "expires_in": 86400, // 1 day
                        "user": {
                            "id": user.id,
                            "email": user.email,
                            "username": user.username,
                            "role": user.role,
                            "profile_picture": user.profile_picture,
                        }
                    });
                    HttpResponse::Ok().json(response)
                }
                Err(e) => {
                    eprintln!("Failed to generate JWT: {}", e);
                    HttpResponse::InternalServerError().json(json!({
                        "message": format!("Failed to generate JWT: {}", e)
                    }))
                }
            }
        }
        Ok(None) => HttpResponse::Unauthorized().json(json!({
            "message": "Invalid credentials"
        })),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "message": "Failed to fetch user"
            }))
        }
    }
}

#[allow(dead_code)]
pub fn verify_jwt (token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    // Check if token is blacklisted
    if let Ok(blacklist) = TOKEN_BLACKLIST.lock() {
        if blacklist.contains(token) {
            return Err(jsonwebtoken::errors::Error::from(
                jsonwebtoken::errors::ErrorKind::InvalidToken
            ));
        }
    }

    let secret = std::env::var("JWT_SECRET")
    .unwrap_or_else(|_| {
        dotenv().ok();
        std::env::var("JWT_SECRET").expect("JWT_SECRET must be set")
    });

    let validation = Validation::new(jsonwebtoken::Algorithm::HS256);

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation
    )
    .map(|token_data| token_data.claims)
}

// Middleware to protect routes
#[derive(Clone)]
pub struct AuthMiddleware;

// Implement the necessary traits for AuthMiddleware
impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(AuthMiddlewareService { service })
    }
}

// Define the service that will be used by the middleware
pub struct AuthMiddlewareService<S> {
    service: S,
}

// Implement the necessary traits for AuthMiddlewareService
impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = S::Future;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        // Add your authentication logic here
        self.service.call(req)
    }
}

fn validate_username(username: &str) -> Result<(), String> {
    if !USERNAME_REGEX.is_match(username) {
        return Err("Username must be between 3 and 20 characters, and can only contain letters, numbers, and underscores".to_string());
    }
    Ok(())
}

fn validate_email(email: &str) -> Result<(), String> {
    if !EMAIL_REGEX.is_match(email) {
        return Err("Invalid email format".to_string());
    }
    Ok(())
}
// Create a new user
pub async fn add_user(
    pool: web::Data<PgPool>,
    new_user: web::Json<CreateUserData>,
) -> impl Responder {

    // Validate username
    if let Err(e) = validate_username(&new_user.username) {
        return HttpResponse::BadRequest().json(json!({
            "message": e
        }));
    }

    // Validate email
    if let Err(e) = validate_email(&new_user.email) {
        return HttpResponse::BadRequest().json(json!({
            "message": e
        }));
    }

    let result = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (email, password_hash, username, role, profile_picture)
        VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5)
        RETURNING id, email, password_hash, username, role as "role!: UserRole",
        profile_picture, created_at, updated_at
        "#,
        new_user.email,
        new_user.password,
        new_user.username,
        new_user.role.clone() as UserRole,
        new_user.profile_picture,
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(e) => {
            eprintln!("Error adding user: {:?}", e);
            // Check for duplicate email
            if let sqlx::Error::Database(db_error) = e {
                match db_error.constraint() {
                    Some("users_email_key") => {
                        return HttpResponse::BadRequest().json(json!({
                            "message": "Email already exists"
                        }));
                    }
                    Some("users_username_key") => {
                        return HttpResponse::BadRequest().json(json!({
                            "message": "Username already exists"
                        }));
                    }
                    Some("username_format") => {
                    return HttpResponse::BadRequest().json(json!({
                        "message": "Username must be between 3 and 20 characters, and can only contain letters, numbers, and underscores"
                        }));
                    }
                    _ => {}
                }
            }
            // If it's not a duplicate email, return a generic error
            HttpResponse::InternalServerError().json(json!({
                "message": "Failed to add user"
            }))
        }
    }
}

// Get a user by id
pub async fn get_user(pool: web::Data<PgPool>, id: web::Path<i32>) -> impl Responder {
    let result = sqlx::query_as!(
        User,
        r#"
        SELECT id, email, password_hash, username, role as "role: UserRole",
        profile_picture, created_at, updated_at
        FROM users WHERE id = $1
        "#,
        id.into_inner()
    )
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(user)) => HttpResponse::Ok().json(user),
        Ok(None) => HttpResponse::NotFound().body("User not found"),
        Err(e) => {
            eprintln!("Error getting user: {:?}", e);
            HttpResponse::InternalServerError().body("Failed to get user")
        }
    }
}

// Update a user
pub async fn update_user(
    pool: web::Data<PgPool>,
    id: web::Path<i32>,
    update_data: web::Json<UpdateUserData>
) -> impl Responder {
    let id_value = id.into_inner();

    let mut query_builder = QueryBuilder::new(
        "UPDATE users SET updated_at = CURRENT_TIMESTAMP"
    );

    // Log the incoming data
    println!("Updating user {} with data: {:?}", id_value, update_data);

    if let Some(email) = &update_data.email {
        query_builder.push(", email = ");
        query_builder.push_bind(email);
    }

    if let Some(username) = &update_data.username {
        query_builder.push(", username = ");
        query_builder.push_bind(username);
    }

    if let Some(password) = &update_data.password {
        query_builder.push(", password_hash = crypt(");
        query_builder.push_bind(password);
        query_builder.push(", gen_salt('bf'))");
    }

    if let Some(profile_picture) = &update_data.profile_picture {
        query_builder.push(", profile_picture = ");
        query_builder.push_bind(profile_picture);
    }

    query_builder.push(" WHERE id = ");
    query_builder.push_bind(id_value);
    query_builder.push(
        " RETURNING id, email, password_hash, username, \
         (SELECT role::text)::user_role as role, \
         profile_picture, created_at, updated_at"
    );

    let result = query_builder
        .build_query_as::<User>()
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(user)) => HttpResponse::Ok().json(user),
        Ok(None) => {
            println!("User not found with id: {}", id_value);
            HttpResponse::NotFound().json(json!({
                "message": "User not found"
            }))
        },
        Err(e) => {
            eprintln!("Database error while updating user: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "message": format!("Failed to update user: {}", e)
            }))
        }
    }
}

// Delete a user
pub async fn delete_user(
    pool: web::Data<PgPool>,
    id: web::Path<i32>
) -> impl Responder {
    let result = sqlx::query!(
        "DELETE FROM users WHERE id = $1 RETURNING id",
        id.into_inner()
    )
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(_)) => HttpResponse::Ok().body("User deleted successfully"),
        Ok(None) => HttpResponse::NotFound().body("User not found"),
        Err(e) => {
            eprintln!("Error deleting user: {:?}", e);
            HttpResponse::InternalServerError().body("Failed to delete user")
        }
    }
}

// Search for users
pub async fn search_users(
    pool: web::Data<PgPool>,
    params: web::Query<SearchUserParams>
) -> impl Responder {
    let mut query_builder = QueryBuilder::new(
        "SELECT id, email, password_hash, username, role as \"role: UserRole\", \
         profile_picture, created_at, updated_at FROM users WHERE 1=1"
    );

    if let Some(email) = &params.email {
        query_builder.push(" AND email ILIKE ");
        query_builder.push_bind(format!("%{}%", email));
    }

    if let Some(username) = &params.username {
        query_builder.push(" AND username ILIKE ");
        query_builder.push_bind(format!("%{}%", username));
    }

    if let Some(role) = &params.role {
        query_builder.push(" AND role = ");
        query_builder.push_bind(role);
    }

    let result = query_builder
        .build_query_as::<User>()
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(users) => HttpResponse::Ok().json(users),
        Err(e) => {
            eprintln!("Error searching users: {:?}", e);
            HttpResponse::InternalServerError().body("Failed to search users")
        }
    }
}

// Get all users
pub async fn get_all_users(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as!(
        User,
        r#"
        SELECT id, email, password_hash, username, role as "role: UserRole",
        profile_picture, created_at, updated_at
        FROM users
        ORDER BY id
        "#,
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(users) => HttpResponse::Ok().json(users),
        Err(e) => {
            eprintln!("Error fetching users: {:?}", e);
            HttpResponse::InternalServerError().body("Failed to fetch users")
        }
    }
}

pub async fn get_user_by_email(
    pool: web::Data<PgPool>,
    email: web::Path<String>,
) -> impl Responder {
    let result = sqlx::query_as!(
        User,
        r#"
        SELECT id, email, password_hash, username, role as "role!: UserRole",
        profile_picture, created_at, updated_at
        FROM users
        WHERE email = $1
        "#,
        email.into_inner()
    )
    .fetch_optional(&**pool)
    .await;

    match result {
        Ok(Some(user)) => HttpResponse::Ok().json(user),
        Ok(None) => HttpResponse::NotFound().json(json!({
            "message": "User not found"
        })),
        Err(e) => HttpResponse::InternalServerError().json(json!({
            "message": format!("Database error: {}", e)
        }))
    }
}

pub async fn get_user_by_username(
    pool: web::Data<PgPool>,
    username: web::Path<String>,
) -> impl Responder {
    let result = sqlx::query_as!(User, r#"
        SELECT id, email, password_hash, username, role as "role!: UserRole",
        profile_picture, created_at, updated_at
        FROM users
        WHERE username = $1
        "#,
        username.into_inner()
    )
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(user)) => HttpResponse::Ok().json(user),
        Ok(None) => HttpResponse::NotFound().json(json!({
            "message": "User not found"
        })),
        Err(e) => HttpResponse::InternalServerError().json(json!({
            "message": format!("Database error: {}", e)
        }))
    }
}

pub async fn verify_password(
    pool: web::Data<PgPool>,
    request: web::Json<VerifyPasswordRequest>,
) -> impl Responder {
    // First, find the user by email or username
    let user_query = sqlx::query_as!(
        User,
        r#"
        SELECT id, email, password_hash, username, role as "role!: UserRole",
        profile_picture, created_at, updated_at
        FROM users
        WHERE email = $1 OR username = $1
        "#,
        request.identifier
    )
    .fetch_optional(&**pool)
    .await;

    match user_query {
        Ok(Some(user)) => {
            // Verify the password using bcrypt
            let is_valid = bcrypt::verify(&request.password, &user.password_hash)
                .unwrap_or(false);

            if is_valid {
                // If password is valid, return user data (excluding password_hash)
                let user_response = User {
                    password_hash: "".to_string(), // Don't send password hash
                    ..user
                };

                HttpResponse::Ok().json(VerifyPasswordResponse {
                    valid: true,
                    user: Some(user_response),
                })
            } else {
                HttpResponse::Ok().json(VerifyPasswordResponse {
                    valid: false,
                    user: None,
                })
            }
        }
        Ok(None) => HttpResponse::Ok().json(VerifyPasswordResponse {
            valid: false,
            user: None,
        }),
        Err(e) => {
            eprintln!("Database error during password verification: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "message": "Internal server error during authentication"
            }))
        }
    }
}

pub async fn logout(req: HttpRequest) -> impl Responder {
    // Extract the token from the Authorization header
    if let Some(auth_header) = req.headers().get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = auth_str[7..].to_string();

                // Add the token to the blacklist
                if let Ok(mut blacklist) = TOKEN_BLACKLIST.lock() {
                    blacklist.insert(token);
                    return HttpResponse::Ok().json(json!({
                        "message": "Successfully logged out"
                    }));
                }
            }
        }
    }

    HttpResponse::BadRequest().json(json!({
        "message": "Invalid token format"
    }))
}