use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool};
use chrono::NaiveDateTime;

// Define RSVP status enum
#[derive(Debug, Deserialize, Serialize, Clone, sqlx::Type, PartialEq)]
#[sqlx(type_name = "serving_status_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ServingStatusType {
    Pending,
    Confirmed,
    Declined,
}

impl std::fmt::Display for ServingStatusType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServingStatusType::Pending => write!(f, "pending"),
            ServingStatusType::Confirmed => write!(f, "confirmed"),
            ServingStatusType::Declined => write!(f, "declined"),
        }
    }
}

impl std::str::FromStr for ServingStatusType {
    type Err = String;

    fn from_str(s: &str) -> Result<ServingStatusType, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" => Ok(ServingStatusType::Pending),
            "confirmed" => Ok(ServingStatusType::Confirmed),
            "declined" => Ok(ServingStatusType::Declined),
            _ => Err(format!("Invalid status: {}", s)),
        }
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ServingRSVPRequest {
    pub user_id: Option<i32>,
    pub serving_id: i32,
    pub email: String,
    pub name: String,
    pub phone: Option<String>,
    pub rsvp_status: ServingStatusType,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct ServingRSVPResponse {
    id: i32,
    user_id: Option<i32>,
    serving_id: i32,
    email: String,
    name: String,
    phone: Option<String>,
    rsvp_status: ServingStatusType,
    rsvp_date: NaiveDateTime,
    serving_title: Option<String>,
    serving_location: Option<String>,
}
// Create a new serving RSVP
pub async fn create_serving_rsvp(
    pool: web::Data<PgPool>,
    rsvp_data: web::Json<ServingRSVPRequest>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        WITH serving_info AS (
            SELECT title as serving_title, location as serving_location
            FROM serving WHERE id = $2
        )
        INSERT INTO servingrsvps
        (user_id, serving_id, email, name, phone, rsvp_status, rsvp_date)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING
        id, user_id, serving_id, email, name, phone, rsvp_status as "rsvp_status!: ServingStatusType",
        rsvp_date,
        (SELECT serving_title FROM serving_info) as serving_title,
        (SELECT serving_location FROM serving_info) as serving_location
        "#,
        rsvp_data.user_id,
        rsvp_data.serving_id,
        rsvp_data.email,
        rsvp_data.name,
        rsvp_data.phone,
        rsvp_data.rsvp_status.clone() as ServingStatusType
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(rsvp) => HttpResponse::Ok().json(ServingRSVPResponse {
            id: rsvp.id,
            user_id: rsvp.user_id,
            serving_id: rsvp.serving_id,
            email: rsvp.email,
            name: rsvp.name,
            phone: rsvp.phone,
            rsvp_status: rsvp.rsvp_status,
            rsvp_date: rsvp.rsvp_date.expect("RSVP date should be present"),
            serving_title: Some(rsvp.serving_title.unwrap_or_default()),
            serving_location: Some(rsvp.serving_location.unwrap_or_default()),
        }),
        Err(e) => {
            eprintln!("Failed to create serving RSVP: {}", e);
            HttpResponse::InternalServerError().json(format!("Failed to create serving RSVP: {}", e))
        }
    }
}

// Get all serving RSVPs
pub async fn get_all_serving_rsvps(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query!(
        r#"
        SELECT
            sr.id, sr.user_id, sr.serving_id, sr.email, sr.name, sr.phone,
            sr.rsvp_status as "rsvp_status!: ServingStatusType", sr.rsvp_date,
            (SELECT title FROM serving WHERE id = sr.serving_id) as serving_title,
            (SELECT location FROM serving WHERE id = sr.serving_id) as serving_location
        FROM servingrsvps sr
        ORDER BY sr.rsvp_date DESC
        "#
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(rsvps) => {
            let response: Vec<ServingRSVPResponse> = rsvps
                .iter()
                .map(|r| ServingRSVPResponse {
                    id: r.id,
                    user_id: r.user_id,
                    serving_id: r.serving_id,
                    email: r.email.clone(),
                    name: r.name.clone(),
                    phone: r.phone.clone(),
                    rsvp_status: r.rsvp_status.clone(),
                    rsvp_date: r.rsvp_date.expect("RSVP date should be present"),
                    serving_title: Some(r.serving_title.clone().unwrap_or_default()),
                    serving_location: Some(r.serving_location.clone().unwrap_or_default()),
                })
                .collect();
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            eprintln!("Failed to fetch serving RSVPs: {}", e);
            HttpResponse::InternalServerError().json("Failed to fetch serving RSVPs")
        }
    }
}

// Update a serving RSVP
pub async fn update_serving_rsvp (
    pool: web::Data<PgPool>,
    rsvp_id: web::Path<i32>,
    status: web::Json<ServingStatusType>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE servingrsvps
        SET rsvp_status = $1
        WHERE id = $2
        RETURNING id AS "id!", user_id, serving_id, email, name, phone,
        rsvp_status as "rsvp_status!: ServingStatusType", rsvp_date,
        (SELECT title FROM serving WHERE id = serving_id) as serving_title,
        (SELECT location FROM serving WHERE id = serving_id) as serving_location
        "#,
        status.into_inner() as ServingStatusType,
        rsvp_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(rsvp) => HttpResponse::Ok().json(ServingRSVPResponse {
            id: rsvp.id,
            user_id: rsvp.user_id,
            serving_id: rsvp.serving_id,
            email: rsvp.email,
            name: rsvp.name,
            phone: rsvp.phone,
            rsvp_status: rsvp.rsvp_status,
            rsvp_date: rsvp.rsvp_date.expect("RSVP date should be present"),
            serving_title: Some(rsvp.serving_title.unwrap_or_default()),
            serving_location: Some(rsvp.serving_location.unwrap_or_default()),
        }),
        Err(e) => {
            eprintln!("Failed to update serving RSVP status: {}", e);
            HttpResponse::InternalServerError().json("Failed to update serving RSVP status")
        }
    }
}

// Delete a serving RSVP
pub async fn delete_serving_rsvp(
    pool: web::Data<PgPool>,
    rsvp_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        "DELETE FROM servingrsvps WHERE id = $1 RETURNING id",
        rsvp_id.into_inner()
    )
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(_)) => HttpResponse::Ok().json("Serving RSVP deleted successfully"),
        Ok(None) => HttpResponse::NotFound().json("Serving RSVP not found"),
        Err(e) => {
            eprintln!("Failed to delete serving RSVP: {}", e);
            HttpResponse::InternalServerError().json("Failed to delete serving RSVP")
        }
    }
}

// Confirm a serving RSVP
pub async fn confirm_serving_rsvp(
    pool: web::Data<PgPool>,
    rsvp_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE servingrsvps
        SET rsvp_status = 'confirmed'
        WHERE id = $1 AND rsvp_status = 'pending'
        RETURNING id, user_id, serving_id, email, name, phone,
        rsvp_status as "rsvp_status!: ServingStatusType", rsvp_date,
        (SELECT title FROM serving WHERE id = serving_id) as serving_title,
        (SELECT location FROM serving WHERE id = serving_id) as serving_location
        "#,
        rsvp_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(rsvp) => HttpResponse::Ok().json(ServingRSVPResponse {
            id: rsvp.id,
            user_id: rsvp.user_id,
            serving_id: rsvp.serving_id,
            email: rsvp.email,
            name: rsvp.name,
            phone: rsvp.phone,
            rsvp_status: rsvp.rsvp_status,
            rsvp_date: rsvp.rsvp_date.expect("RSVP date should be present"),
            serving_title: Some(rsvp.serving_title.unwrap_or_default()),
            serving_location: Some(rsvp.serving_location.unwrap_or_default()),
        }),
        Err(e) => {
            eprintln!("Failed to confirm serving RSVP: {}", e);
            HttpResponse::InternalServerError().json("Failed to confirm serving RSVP")
        }
    }
}

// Decline a serving RSVP
pub async fn decline_serving_rsvp(
    pool: web::Data<PgPool>,
    rsvp_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE servingrsvps
        SET rsvp_status = 'declined'
        WHERE id = $1 AND rsvp_status = 'pending'
        RETURNING id, user_id, serving_id, email, name, phone,
        rsvp_status as "rsvp_status!: ServingStatusType", rsvp_date,
        (SELECT title FROM serving WHERE id = serving_id) as serving_title,
        (SELECT location FROM serving WHERE id = serving_id) as serving_location
        "#,
        rsvp_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(rsvp) => HttpResponse::Ok().json(ServingRSVPResponse {
            id: rsvp.id,
            user_id: rsvp.user_id,
            serving_id: rsvp.serving_id,
            email: rsvp.email,
            name: rsvp.name,
            phone: rsvp.phone,
            rsvp_status: rsvp.rsvp_status,
            rsvp_date: rsvp.rsvp_date.expect("RSVP date should be present"),
            serving_title: Some(rsvp.serving_title.unwrap_or_default()),
            serving_location: Some(rsvp.serving_location.unwrap_or_default()),
        }),
        Err(e) => {
            eprintln!("Failed to decline serving RSVP: {}", e);
            HttpResponse::InternalServerError().json("Failed to decline serving RSVP")
        }
    }
}


#[derive(Serialize)]
pub struct ServingWithResponse {
    id: i32,
    email: String,
    serving_id: i32,
    user_id: Option<i32>,
    rsvp_status: ServingStatusType,
    serving_date: NaiveDateTime,
    name: String,
    location: Option<String>,
    serving_title: Option<String>,
    serving_location: Option<String>,
}

#[derive(Deserialize)]
pub struct SearchParams {
    pub email: Option<String>,
    pub name: Option<String>,
    pub rsvp_status: Option<ServingStatusType>,
    pub user_id: Option<i32>,
}

pub async fn search_serving_rsvp(
    pool: web::Data<PgPool>,
    query: web::Query<SearchParams>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        SELECT
            id,
            user_id,
            serving_id,
            email,
            name,
            phone,
            rsvp_status as "rsvp_status!: ServingStatusType",
            rsvp_date,
            (SELECT title FROM serving WHERE id = serving_id) as serving_title,
            (SELECT location FROM serving WHERE id = serving_id) as serving_location
        FROM servingrsvps
        WHERE ($1::text IS NULL OR LOWER(email) LIKE CONCAT('%', LOWER($1), '%'))
        AND ($2::text IS NULL OR LOWER(name) LIKE CONCAT('%', LOWER($2), '%'))
        AND ($3::text IS NULL OR rsvp_status::text = $3)
        AND ($4::integer IS NULL OR user_id = $4)
        ORDER BY rsvp_date DESC
        "#,
        query.email.as_deref(),
        query.name.as_deref(),
        query.rsvp_status.as_ref().map(|s| s.to_string()),
        query.user_id
    )
    .fetch_all(pool.get_ref())
    .await
    .map(|rows| {
        rows.into_iter()
            .map(|row| ServingRSVPResponse {
                id: row.id,
                user_id: row.user_id,
                serving_id: row.serving_id,
                email: row.email,
                name: row.name,
                phone: row.phone,
                rsvp_status: row.rsvp_status,
                rsvp_date: row.rsvp_date.expect("RSVP date should be present"),
                serving_title: Some(row.serving_title.unwrap_or_default()),
                serving_location: Some(row.serving_location.unwrap_or_default()),
            })
            .collect::<Vec<_>>()
    });

    match result {
        Ok(rsvps) => HttpResponse::Ok().json(rsvps),
        Err(e) => {
            eprintln!("Search error: {}", e);
            HttpResponse::InternalServerError().json("Failed to search RSVPs")
        }
    }
}

