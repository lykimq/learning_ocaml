use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use chrono::NaiveDateTime;

// Define Signup status enum
#[derive(Debug, Deserialize, Serialize, Clone, sqlx::Type, PartialEq)]
#[sqlx(type_name = "signup_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum SignupStatus {
    Pending,
    Confirmed,
    Declined,
}

impl std::fmt::Display for SignupStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SignupStatus::Pending => write!(f, "pending"),
            SignupStatus::Confirmed => write!(f, "confirmed"),
            SignupStatus::Declined => write!(f, "declined"),
        }
    }
}

impl std::str::FromStr for SignupStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<SignupStatus, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" => Ok(SignupStatus::Pending),
            "confirmed" => Ok(SignupStatus::Confirmed),
            "declined" => Ok(SignupStatus::Declined),
            _ => Err(format!("Invalid status: {}", s)),
        }
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ServingSignupRequest {
    pub user_id: Option<i32>,
    pub serving_id: i32,
    pub email: String,
    pub name: String,
    pub phone: Option<String>,
    pub signup_status: SignupStatus,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct ServingSignupResponse {
    id: i32,
    user_id: Option<i32>,
    serving_id: i32,
    email: String,
    name: String,
    phone: Option<String>,
    signup_status: SignupStatus,
    signup_date: NaiveDateTime,
}
// Create a new serving signup
pub async fn create_serving_signup(
    pool: web::Data<PgPool>,
    signup_data: web::Json<ServingSignupRequest>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        INSERT INTO servingsignups
        (user_id, serving_id, email, name, phone, signup_status, signup_date)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING
        id, user_id, serving_id, email, name, phone, signup_status as "signup_status!: SignupStatus",
        signup_date
        "#,
        signup_data.user_id,
        signup_data.serving_id,
        signup_data.email,
        signup_data.name,
        signup_data.phone,
        signup_data.signup_status.clone() as SignupStatus
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(signup) => HttpResponse::Ok().json(ServingSignupResponse {
            id: signup.id,
            user_id: signup.user_id,
            serving_id: signup.serving_id,
            email: signup.email,
            name: signup.name,
            phone: signup.phone,
            signup_status: signup.signup_status,
            signup_date: signup.signup_date.expect("Signup date should be present"),
        }),
        Err(e) => {
            eprintln!("Failed to create serving signup: {}", e);
            HttpResponse::InternalServerError().json(format!("Failed to create serving signup: {}", e))
        }
    }
}

// Get all serving signups
pub async fn get_all_serving_signups(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query!(
        r#"
        SELECT id, user_id, serving_id, email, name, phone,
               signup_status as "signup_status!: SignupStatus", signup_date
        FROM servingsignups
        ORDER BY signup_date DESC
        "#
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(signups) => {
            let response: Vec<ServingSignupResponse> = signups
                .iter()
                .map(|r| ServingSignupResponse {
                    id: r.id,
                    user_id: r.user_id,
                    serving_id: r.serving_id,
                    email: r.email.clone(),
                    name: r.name.clone(),
                    phone: r.phone.clone(),
                    signup_status: r.signup_status.clone(),
                    signup_date: r.signup_date.expect("Signup date should be present"),
                })
                .collect();
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            eprintln!("Failed to fetch serving signups: {}", e);
            HttpResponse::InternalServerError().json("Failed to fetch serving signups")
        }
    }
}

// Update a serving signup
pub async fn update_serving_signup(
    pool: web::Data<PgPool>,
    signup_id: web::Path<i32>,
    status: web::Json<SignupStatus>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE servingsignups
        SET signup_status = $1
        WHERE id = $2
        RETURNING id AS "id!", user_id, serving_id, email, name, phone,
        signup_status as "signup_status!: SignupStatus", signup_date
        "#,
        status.into_inner() as SignupStatus,
        signup_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(signup) => HttpResponse::Ok().json(ServingSignupResponse {
            id: signup.id,
            user_id: signup.user_id,
            serving_id: signup.serving_id,
            email: signup.email,
            name: signup.name,
            phone: signup.phone,
            signup_status: signup.signup_status,
            signup_date: signup.signup_date.expect("Signup date should be present"),
        }),
        Err(e) => {
            eprintln!("Failed to update serving signup status: {}", e);
            HttpResponse::InternalServerError().json("Failed to update serving signup status")
        }
    }
}

// Delete a serving signup
pub async fn delete_serving_signup(
    pool: web::Data<PgPool>,
    signup_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        "DELETE FROM servingsignups WHERE id = $1 RETURNING id",
        signup_id.into_inner()
    )
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(_)) => HttpResponse::Ok().json("Serving signup deleted successfully"),
        Ok(None) => HttpResponse::NotFound().json("Serving signup not found"),
        Err(e) => {
            eprintln!("Failed to delete serving signup: {}", e);
            HttpResponse::InternalServerError().json("Failed to delete serving signup")
        }
    }
}

// Confirm a serving signup
pub async fn confirm_serving_signup(
    pool: web::Data<PgPool>,
    signup_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE servingsignups
        SET signup_status = 'confirmed'
        WHERE id = $1 AND signup_status = 'pending'
        RETURNING id, user_id, serving_id, email, name, phone,
        signup_status as "signup_status!: SignupStatus", signup_date
        "#,
        signup_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(signup) => HttpResponse::Ok().json(ServingSignupResponse {
            id: signup.id,
            user_id: signup.user_id,
            serving_id: signup.serving_id,
            email: signup.email,
            name: signup.name,
            phone: signup.phone,
            signup_status: signup.signup_status,
            signup_date: signup.signup_date.expect("Signup date should be present"),
        }),
        Err(e) => {
            eprintln!("Failed to confirm serving signup: {}", e);
            HttpResponse::InternalServerError().json("Failed to confirm serving signup")
        }
    }
}

// Decline a serving signup
pub async fn decline_serving_signup(
    pool: web::Data<PgPool>,
    signup_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE servingsignups
        SET signup_status = 'declined'
        WHERE id = $1 AND signup_status = 'pending'
        RETURNING id, user_id, serving_id, email, name, phone,
        signup_status as "signup_status!: SignupStatus", signup_date
        "#,
        signup_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(signup) => HttpResponse::Ok().json(ServingSignupResponse {
            id: signup.id,
            user_id: signup.user_id,
            serving_id: signup.serving_id,
            email: signup.email,
            name: signup.name,
            phone: signup.phone,
            signup_status: signup.signup_status,
            signup_date: signup.signup_date.expect("Signup date should be present"),
        }),
        Err(e) => {
            eprintln!("Failed to decline serving signup: {}", e);
            HttpResponse::InternalServerError().json("Failed to decline serving signup")
        }
    }
}


#[derive(Serialize)]
pub struct ServingWithResponse {
    id: i32,
    email: String,
    serving_id: i32,
    user_id: Option<i32>,
    signup_status: SignupStatus,
    serving_date: NaiveDateTime,
    name: String,
    location: Option<String>,
}

#[derive(Deserialize)]
pub struct SearchQuery {
    pub email: Option<String>,
    pub name: Option<String>,
    pub signup_status: Option<SignupStatus>,
    pub user_id: Option<i32>,
}


pub async fn search_serving_signup(
    pool: web::Data<PgPool>,
    params: web::Query<SearchQuery>,
) -> impl Responder {
    let mut count_query = sqlx::QueryBuilder::new(
        "SELECT COUNT(*) as count
         FROM servingsignups ss
         JOIN users u ON ss.user_id = u.id
         WHERE 1=1"
    );

    // Apply email filter if provided
    if let Some(email) = &params.email {
        let search_pattern = format!("%{}%", email.trim().to_lowercase());
        count_query.push(" AND LOWER(ss.email) LIKE ");
        count_query.push_bind(search_pattern);
    }

    // Apply name filter if provided
    if let Some(name) = &params.name {
        let search_pattern = format!("%{}%", name.trim().to_lowercase());
        count_query.push(" AND LOWER(u.name) LIKE ");
        count_query.push_bind(search_pattern);
    }

    // Apply user ID filter if provided
    if let Some(user_id) = params.user_id {
        count_query.push(" AND ss.user_id = ");
        count_query.push_bind(user_id);
    }

    // Apply signup status filter if provided
    if let Some(status) = &params.signup_status {
        count_query.push(" AND ss.signup_status = ");
        count_query.push_bind(status.clone() as SignupStatus);
    }

    // Execute count query first
    let total_count = match count_query
        .build()
        .fetch_one(pool.get_ref())
        .await {
            Ok(row) => row.get::<i64, _>("count"),
            Err(e) => {
                eprintln!("Count query error: {}", e);
                return HttpResponse::InternalServerError().json("Failed to count signups");
            }
        };

    // Default sorting by signup date
    let mut search_query = sqlx::QueryBuilder::new(
        "SELECT ss.id, ss.email, ss.user_id, ss.signup_status as \"signup_status\",
                ss.signup_date, u.name as user_name
         FROM servingsignups ss
         JOIN users u ON ss.user_id = u.id
         WHERE 1=1"
    );

    // Apply email filter if provided
    if let Some(email) = &params.email {
        let search_pattern = format!("%{}%", email.trim().to_lowercase());
        search_query.push(" AND LOWER(ss.email) LIKE ");
        search_query.push_bind(search_pattern);
    }

    // Apply name filter if provided
    if let Some(name) = &params.name {
        let search_pattern = format!("%{}%", name.trim().to_lowercase());
        search_query.push(" AND LOWER(u.name) LIKE ");
        search_query.push_bind(search_pattern);
    }

    // Apply user ID filter if provided
    if let Some(user_id) = params.user_id {
        search_query.push(" AND ss.user_id = ");
        search_query.push_bind(user_id);
    }

    // Apply signup status filter if provided
    if let Some(status) = &params.signup_status {
        search_query.push(" AND ss.signup_status = ");
        search_query.push_bind(status.clone() as SignupStatus);
    }

    // Execute the query
    search_query.push(" ORDER BY ss.signup_date DESC");

    match search_query
        .build()
        .fetch_all(pool.get_ref())
        .await {
        Ok(signups) => {
            let converted_signups: Vec<ServingSignupResponse> = signups
                .iter()
                .map(|r| ServingSignupResponse {
                    id: r.try_get("id").unwrap(),
                    user_id: r.try_get("user_id").unwrap(),
                    serving_id: r.try_get("serving_id").unwrap(),
                    email: r.try_get("email").unwrap(),
                    name: r.try_get("user_name").unwrap(),
                    phone: r.try_get("phone").ok(),
                    signup_status: r.try_get::<SignupStatus, _>("signup_status").unwrap(),
                    signup_date: r.try_get("signup_date").unwrap(),
                })
                .collect();

            let response = serde_json::json!({
                "signups": converted_signups,
                "total": total_count as usize,
            });

            HttpResponse::Ok().json(response)
        }
        Err(err) => {
            eprintln!("Search error: {}", err);
            HttpResponse::InternalServerError().json("Failed to search signups")
        }
    }
}

