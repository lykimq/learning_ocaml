use actix_web::{
    web,
    HttpResponse,
    Responder
};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, QueryBuilder};
use serde_json::json;

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

#[derive(Deserialize, Serialize, sqlx::FromRow)]
pub struct User {
    pub id: i32,
    pub email: String,
    pub password_hash: String,
    pub name: String,
    pub role: UserRole,
    pub profile_picture: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Deserialize)]
pub struct CreateUserData {
    pub email: String,
    pub password: String,
    pub name: String,
    pub role: UserRole,
    pub profile_picture: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateUserData {
    pub email: Option<String>,
    pub password: Option<String>,
    pub name: Option<String>,
    pub role: Option<UserRole>,
    pub profile_picture: Option<String>,
}

#[derive(Deserialize)]
pub struct SearchUserParams {
    pub email: Option<String>,
    pub name: Option<String>,
    pub role: Option<UserRole>,
}

// Create a new user
pub async fn add_user(
    pool: web::Data<PgPool>,
    new_user: web::Json<CreateUserData>,
) -> impl Responder {
    let result = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (email, password_hash, name, role, profile_picture)
        VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5)
        RETURNING id, email, password_hash, name, role as "role!: UserRole",
        profile_picture, created_at, updated_at
        "#,
        new_user.email,
        new_user.password,
        new_user.name,
        new_user.role.clone() as UserRole,
        new_user.profile_picture,
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(e) => {
            eprintln!("Error adding user: {:?}", e);
            HttpResponse::InternalServerError().body("Failed to add user")
        }
    }
}

// Get a user by id
pub async fn get_user(pool: web::Data<PgPool>, id: web::Path<i32>) -> impl Responder {
    let result = sqlx::query_as!(
        User,
        r#"
        SELECT id, email, password_hash, name, role as "role: UserRole",
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
    let mut query_builder = QueryBuilder::new(
        "UPDATE users SET updated_at = CURRENT_TIMESTAMP"
    );

    if let Some(email) = &update_data.email {
        query_builder.push(", email = ");
        query_builder.push_bind(email);
    }

    if let Some(password) = &update_data.password {
        query_builder.push(", password_hash = crypt(");
        query_builder.push_bind(password);
        query_builder.push(", gen_salt('bf'))");
    }

    if let Some(name) = &update_data.name {
        query_builder.push(", name = ");
        query_builder.push_bind(name);
    }

    if let Some(role) = &update_data.role {
        query_builder.push(", role = ");
        query_builder.push_bind(role);
    }

    if let Some(profile_picture) = &update_data.profile_picture {
        query_builder.push(", profile_picture = ");
        query_builder.push_bind(profile_picture);
    }

    query_builder.push(" WHERE id = ");
    query_builder.push_bind(id.into_inner());
    query_builder.push(" RETURNING id, email, password_hash, name, role as \"role: UserRole\", profile_picture, created_at, updated_at");

    let result = query_builder
        .build_query_as::<User>()
        .fetch_optional(pool.get_ref())
        .await;

    match result {
        Ok(Some(user)) => HttpResponse::Ok().json(user),
        Ok(None) => HttpResponse::NotFound().body("User not found"),
        Err(e) => {
            eprintln!("Error updating user: {:?}", e);
            HttpResponse::InternalServerError().body("Failed to update user")
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
        "SELECT id, email, password_hash, name, role as \"role: UserRole\", \
         profile_picture, created_at, updated_at FROM users WHERE 1=1"
    );

    if let Some(email) = &params.email {
        query_builder.push(" AND email ILIKE ");
        query_builder.push_bind(format!("%{}%", email));
    }

    if let Some(name) = &params.name {
        query_builder.push(" AND name ILIKE ");
        query_builder.push_bind(format!("%{}%", name));
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
        SELECT id, email, password_hash, name, role as "role: UserRole",
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
        SELECT id, email, password_hash, name, role as "role!: UserRole",
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
