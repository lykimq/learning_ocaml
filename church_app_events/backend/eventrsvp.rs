use std::collections::HashMap;

use actix_web::{web::{self}, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow, Row};
use chrono::{NaiveDate, NaiveTime};
use serde_json::json;


// Define RSVP status enum
#[derive(Debug, Deserialize, Serialize, Clone, sqlx::Type, PartialEq)]
#[sqlx(type_name = "serving_status_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ServingStatusType {
    Pending,
    Confirmed,
    Declined
}

impl std::fmt::Display for ServingStatusType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServingStatusType::Pending => write!(f,"pending"),
            ServingStatusType::Confirmed => write!(f,"confirmed"),
            ServingStatusType::Declined => write!(f,"declined"),
        }
    }
}

impl std::str::FromStr for ServingStatusType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" => Ok(ServingStatusType::Pending),
            "confirmed" => Ok(ServingStatusType::Confirmed),
            "declined" => Ok(ServingStatusType::Declined),
            _ => Err(format!("Invalid status: {}", s))
        }
    }
}

#[derive(Deserialize)]
pub struct EventRSVPRequest {
    email: String,
    event_id: i32,
    user_id: Option<i32>,
    rsvp_status: ServingStatusType,
}

#[derive(Serialize)]
pub struct RSVPResponse {
    id: i32,
    email: String,
    event_id: i32,
    user_id: Option<i32>,
    rsvp_status: ServingStatusType,
    rsvp_date: NaiveDate,
}

// Add these response structs
#[derive(Serialize)]
pub struct RSVPListResponse {
    id: i32,
    email: String,
    event_id: i32,
    user_id: Option<i32>,
    rsvp_status: ServingStatusType,
    rsvp_date: NaiveDate,
}

#[derive(Serialize)]
pub struct RSVPWithEventResponse {
    id: i32,
    email: String,
    event_id: i32,
    user_id: Option<i32>,
    rsvp_status: ServingStatusType,
    rsvp_date: NaiveDate,
    event_title: String,
    event_date: NaiveDate,
    event_time: NaiveTime,
}

// Add this response struct for search results
#[derive(Serialize, FromRow, Clone)]
pub struct RSVPSearchResponse {
    id: i32,
    email: String,
    event_id: i32,
    user_id: Option<i32>,
    rsvp_status: ServingStatusType,
    rsvp_date: NaiveDate,
    event_title: String,
    event_date: NaiveDate,
    event_time: NaiveTime,
}

// Add this struct definition before the search_rsvps function
#[derive(Serialize)]
pub struct SearchResponse {
    rsvps: Vec<RSVPWithEventResponse>,
    total: usize,
    status_counts: HashMap<String, usize>,
}

// Create a new RSVP
pub async fn create_rsvp(
    pool: web::Data<PgPool>,
    rsvp_data: web::Json<EventRSVPRequest>) -> impl Responder {
        // Check if the event exists for this email and event
        let existing = sqlx::query!(
            "SELECT user_id FROM EventRSVP WHERE email = $1 AND event_id = $2",
            rsvp_data.email,
            rsvp_data.event_id
        )
        .fetch_optional(pool.get_ref())
        .await;

    match existing {
        Ok(Some(_)) => {
            HttpResponse::BadRequest().json("This email has already RSVP'd to this event")
        }
        Ok(None) => {
            // Determine initial status based on the request
            let initial_status = match rsvp_data.rsvp_status {
                ServingStatusType::Declined => ServingStatusType::Declined,
                _ => ServingStatusType::Pending
            };

            let result = sqlx::query!(
                r#"
                INSERT INTO eventrsvp (email, event_id, user_id, rsvp_date, rsvp_status)
                VALUES ($1, $2, $3, CURRENT_DATE, $4)
                RETURNING id, email, event_id, user_id, rsvp_status as "rsvp_status!: ServingStatusType", rsvp_date
                "#,
                rsvp_data.email,
                rsvp_data.event_id,
                rsvp_data.user_id,
                initial_status as ServingStatusType,
            )
            .fetch_one(pool.get_ref())
            .await;


            match result {
                Ok(rsvp) => HttpResponse::Ok().json(RSVPResponse {
                    id: rsvp.id,
                    email: rsvp.email,
                    event_id: rsvp.event_id,
                    user_id: rsvp.user_id,
                    rsvp_status: rsvp.rsvp_status,
                    rsvp_date: rsvp.rsvp_date,
                }),
                Err(e) =>
                {
                    eprintln!("Failed to create RSVP: {}", e);
                    HttpResponse::InternalServerError().json("Failed to insert RSVP")
                },
            }
        }
        Err(e) => {
            eprintln!("Database error: {}", e);
            HttpResponse::InternalServerError().json("Internal server error")
        }
    }
}

// Get all RSVPs with event details
pub async fn get_all_rsvps(
    pool: web::Data<PgPool>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        SELECT r.id, r.email, r.event_id, r.user_id,
               r.rsvp_status as "rsvp_status!: ServingStatusType",
               r.rsvp_date,
               e.event_title, e.event_date, e.event_time
        FROM eventrsvp r
        JOIN events e ON r.event_id = e.id
        ORDER BY e.event_date DESC, e.event_time DESC
        "#
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(rsvps) => {
            // Calculate status counts
            let status_counts = HashMap::from([
                ("confirmed".to_string(),
                    rsvps.iter()
                    .filter(|r| r.rsvp_status == ServingStatusType::Confirmed)
                    .count()),
                ("pending".to_string(),
                    rsvps.iter()
                    .filter(|r| r.rsvp_status == ServingStatusType::Pending)
                    .count()),
                ("declined".to_string(),
                    rsvps.iter()
                    .filter(|r| r.rsvp_status == ServingStatusType::Declined)
                    .count()),
            ]);

            let converted_rsvps: Vec<RSVPWithEventResponse> = rsvps
                .iter()
                .map(|r| RSVPWithEventResponse {
                    id: r.id,
                    email: r.email.clone(),
                    event_id: r.event_id,
                    user_id: r.user_id,
                    rsvp_status: r.rsvp_status.clone(),
                    rsvp_date: r.rsvp_date,
                    event_title: r.event_title.clone(),
                    event_date: r.event_date,
                    event_time: r.event_time.clone(),
                })
                .collect();

            let response = serde_json::json!({
                "rsvps": converted_rsvps,
                "total": rsvps.len(),
                "status_counts": status_counts,
            });

            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            eprintln!("Failed to fetch RSVPs: {}", e);
            HttpResponse::InternalServerError().json("Failed to fetch RSVPs")
        }
    }
}

// Get RSVPs for a specific event with counts
pub async fn get_rsvps_by_event(
    pool: web::Data<PgPool>,
    event_id: web::Path<i32>
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        WITH status_counts AS (
            SELECT
                COUNT(CASE WHEN rsvp_status = 'confirmed' THEN 1 END) as confirmed_count,
                COUNT(CASE WHEN rsvp_status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN rsvp_status = 'declined' THEN 1 END) as declined_count
            FROM eventrsvp
            WHERE event_id = $1
        )
        SELECT er.id, er.email, er.event_id, er.user_id,
               er.rsvp_status as "rsvp_status!: ServingStatusType", er.rsvp_date,
               e.event_title, e.event_date, e.event_time,
               sc.confirmed_count, sc.pending_count, sc.declined_count
        FROM eventrsvp er
        JOIN events e ON er.event_id = e.id
        CROSS JOIN status_counts sc
        WHERE er.event_id = $1
        ORDER BY er.rsvp_date DESC
        "#,
        event_id.into_inner()
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(rsvps) => {
            if rsvps.is_empty() {
                return HttpResponse::NotFound().json("No RSVPs found for this event");
            }

            // Create a response that includes both the RSVP list and the counts
            let response = serde_json::json!({
                "counts": {
                    "confirmed": rsvps[0].confirmed_count,
                    "pending": rsvps[0].pending_count,
                    "declined": rsvps[0].declined_count,
                },
                "rsvps": rsvps.iter().map(|r| RSVPWithEventResponse {
                    id: r.id,
                    email: r.email.clone(),
                    event_id: r.event_id,
                    user_id: r.user_id,
                    rsvp_status: r.rsvp_status.clone(),
                    rsvp_date: r.rsvp_date,
                    event_title: r.event_title.clone(),
                    event_date: r.event_date,
                    event_time: r.event_time.clone(),
                }).collect::<Vec<_>>()
            });

            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            eprintln!("Failed to fetch RSVPs for event: {}", e);
            HttpResponse::InternalServerError().json("Failed to fetch RSVPs")
        }
    }
}

// Get all RSVPs by email
pub async fn get_rsvps_by_email(
    pool: web::Data<PgPool>,
    email: web::Path<String>
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        SELECT er.id, er.email, er.event_id, er.user_id,
               er.rsvp_status as "rsvp_status!: ServingStatusType", er.rsvp_date,
               e.event_title, e.event_date, e.event_time
        FROM eventrsvp er
        JOIN events e ON er.event_id = e.id
        WHERE er.email = $1
        ORDER BY e.event_date DESC
        "#,
        email.into_inner()
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(rsvps) => {
            let response: Vec<RSVPWithEventResponse> = rsvps
                .iter()
                .map(|r| RSVPWithEventResponse {
                    id: r.id,
                    email: r.email.clone(),
                    event_id: r.event_id,
                    user_id: r.user_id,
                    rsvp_status: r.rsvp_status.clone(),
                    rsvp_date: r.rsvp_date,
                    event_title: r.event_title.clone(),
                    event_date: r.event_date,
                    event_time: r.event_time.clone(),
                })
                .collect();
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            eprintln!("Failed to fetch RSVPs: {}", e);
            HttpResponse::InternalServerError().json("Failed to fetch RSVPs")
        }
    }
}

// Update an RSVP
pub async fn update_rsvp(
    pool: web::Data<PgPool>,
    rsvp_id: web::Path<i32>,
    status: web::Json<ServingStatusType>) -> impl Responder {
        let result = sqlx::query!(
            r#"
            UPDATE eventrsvp
            SET rsvp_status = $1
            WHERE id = $2
            RETURNING id, email, event_id, user_id, rsvp_status as "rsvp_status!: ServingStatusType", rsvp_date
            "#,
            status.into_inner() as ServingStatusType,
            rsvp_id.into_inner()
        )
        .fetch_one(pool.get_ref())
        .await;

    match result {
        Ok(rsvp) => HttpResponse::Ok().json(RSVPResponse {
            id: rsvp.id,
            email: rsvp.email,
            event_id: rsvp.event_id,
            user_id: rsvp.user_id,
            rsvp_status: rsvp.rsvp_status,
            rsvp_date: rsvp.rsvp_date,
        }),
        Err(e) => {
            eprintln!("Failed to update RSVP status: {}", e);
            HttpResponse::InternalServerError().json("Failed to update RSVP status")
        }
    }
}

#[derive(Deserialize, Debug)]
pub struct SearchQuery {
    pub email: Option<String>,
    pub event_title: Option<String>,
    pub status: Option<ServingStatusType>,
    pub user_id: Option<i32>,
}


// Delete an RSVP
pub async fn delete_rsvp(
    pool: web::Data<PgPool>,
    rsvp_id: web::Path<i32>
) -> impl Responder {
    let result = sqlx::query!(
        "DELETE FROM eventrsvp WHERE id = $1 RETURNING id",
        rsvp_id.into_inner()
    )
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(_)) => HttpResponse::Ok().json("RSVP deleted successfully"),
        Ok(None) => HttpResponse::NotFound().json("RSVP not found"),
        Err(e) => {
            eprintln!("Failed to delete RSVP: {}", e);
            HttpResponse::InternalServerError().json("Failed to delete RSVP")
        }
    }
}

// Add or update the admin confirmation endpoint
pub async fn confirm_rsvp(
    pool: web::Data<PgPool>,
    rsvp_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE eventrsvp
        SET rsvp_status = 'confirmed'
        WHERE id = $1 AND rsvp_status = 'pending'
        RETURNING id, email, event_id, user_id, rsvp_status as "rsvp_status!: ServingStatusType", rsvp_date
        "#,
        rsvp_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(rsvp) => HttpResponse::Ok().json(RSVPResponse {
            id: rsvp.id,
            email: rsvp.email,
            event_id: rsvp.event_id,
            user_id: rsvp.user_id,
            rsvp_status: rsvp.rsvp_status,
            rsvp_date: rsvp.rsvp_date,
        }),
        Err(e) => {
            eprintln!("Failed to confirm RSVP: {}", e);
            HttpResponse::InternalServerError().json("Failed to confirm RSVP")
        }
    }
}

pub async fn decline_rsvp(
    pool: web::Data<PgPool>,
    rsvp_id: web::Path<i32>
) -> impl Responder {
    // Extract the ID value once at the beginning
    let id = rsvp_id.into_inner();
    println!("Attempting to decline RSVP with ID: {}", id);

    // First check if the RSVP exists
    let rsvp_exists = sqlx::query!(
        "SELECT id FROM eventrsvp WHERE id = $1",
        id  // Use the extracted id
    )
    .fetch_optional(pool.get_ref())
    .await;

    match rsvp_exists {
        Ok(Some(_)) => {
            // RSVP exists, proceed with update
            let result = sqlx::query!(
                r#"
                UPDATE eventrsvp
                SET rsvp_status = 'declined'::serving_status_type
                WHERE id = $1
                RETURNING id, email, event_id, user_id, rsvp_status as "rsvp_status: ServingStatusType", rsvp_date
                "#,
                id  // Use the extracted id
            )
            .fetch_one(pool.get_ref())
            .await;

            match result {
                Ok(rsvp) => {
                    println!("Successfully declined RSVP: {:?}", rsvp.id);
                    HttpResponse::Ok().json(json!({
                        "status": "success",
                        "message": "RSVP declined successfully",
                        "data": {
                            "id": rsvp.id,
                            "email": rsvp.email,
                            "event_id": rsvp.event_id,
                            "user_id": rsvp.user_id,
                            "rsvp_status": rsvp.rsvp_status,
                            "rsvp_date": rsvp.rsvp_date
                        }
                    }))
                },
                Err(e) => {
                    eprintln!("Failed to decline RSVP {}: {}", id, e);
                    HttpResponse::InternalServerError().json(json!({
                        "status": "error",
                        "message": format!("Failed to decline RSVP: {}", e)
                    }))
                }
            }
        },
        Ok(None) => {
            println!("RSVP with ID {} not found", id);
            HttpResponse::NotFound().json(json!({
                "status": "error",
                "message": format!("RSVP with ID {} not found", id)
            }))
        },
        Err(e) => {
            eprintln!("Database error while checking RSVP {}: {}", id, e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "message": format!("Database error: {}", e)
            }))
        }
    }
}

// Search RSVPs
pub async fn search_rsvps(
    pool: web::Data<PgPool>,
    params: web::Query<SearchQuery>,
) -> impl Responder {
    let mut count_query = sqlx::QueryBuilder::new(
        "SELECT COUNT(*) as count
         FROM eventrsvp r
         JOIN events e ON r.event_id = e.id
         WHERE 1=1"
    );

    // Apply status filter if provided
    if let Some(status) = &params.status {
        count_query.push(" AND r.rsvp_status = ");
        count_query.push_bind(status);
    }

    // Email filter with improved pattern matching
    if let Some(email) = &params.email {
        let search_pattern = format!("%{}%", email.trim().to_lowercase());
        count_query.push(" AND LOWER(r.email) LIKE ");
        count_query.push_bind(search_pattern);
    }

    // Event title filter with improved pattern matching
    if let Some(event_title) = &params.event_title {
        let search_pattern = format!("%{}%", event_title.trim().to_lowercase());
        count_query.push(" AND LOWER(e.event_title) LIKE ");
        count_query.push_bind(search_pattern);
    }

    // User ID filter
    if let Some(user_id) = params.user_id {
        count_query.push(" AND r.user_id = ");
        count_query.push_bind(user_id);
    }

    // Execute count query first
    let total_count = match count_query
        .build()
        .fetch_one(pool.get_ref())
        .await {
            Ok(row) => row.get::<i64, _>("count"),
            Err(e) => {
                eprintln!("Count query error: {}", e);
                return HttpResponse::InternalServerError().json("Failed to count RSVPs");
            }
    };

    // Build main search query
    let mut search_query = sqlx::QueryBuilder::new(
        "SELECT r.id, r.email, r.event_id, r.user_id,
                r.rsvp_status as \"rsvp_status\",
                r.rsvp_date, e.event_title, e.event_date, e.event_time
         FROM eventrsvp r
         JOIN events e ON r.event_id = e.id
         WHERE 1=1"
    );

    // Apply the same filters to search query
    if let Some(status) = &params.status {
        search_query.push(" AND r.rsvp_status = ");
        search_query.push_bind(status);
    }

    if let Some(email) = &params.email {
        let search_pattern = format!("%{}%", email.trim().to_lowercase());
        search_query.push(" AND LOWER(r.email) LIKE ");
        search_query.push_bind(search_pattern);
    }

    if let Some(event_title) = &params.event_title {
        let search_pattern = format!("%{}%", event_title.trim().to_lowercase());
        search_query.push(" AND LOWER(e.event_title) LIKE ");
        search_query.push_bind(search_pattern);
    }

    if let Some(user_id) = params.user_id {
        search_query.push(" AND r.user_id = ");
        search_query.push_bind(user_id);
    }

    // Execute the query
    search_query.push(" ORDER BY e.event_date DESC, e.event_time DESC");

    match search_query
        .build()
        .fetch_all(pool.get_ref())
        .await {
        Ok(rsvps) => {
            // Calculate status counts
            let status_counts = HashMap::from([
                ("confirmed".to_string(),
                    rsvps.iter()
                    .filter(|r| {
                        let status: ServingStatusType = r.try_get("rsvp_status").unwrap_or(ServingStatusType::Pending);
                        status == ServingStatusType::Confirmed
                    })
                    .count()),
                ("pending".to_string(),
                    rsvps.iter()
                    .filter(|r| {
                        let status: ServingStatusType = r.try_get("rsvp_status").unwrap_or(ServingStatusType::Pending);
                        status == ServingStatusType::Pending
                    })
                    .count()),
                ("declined".to_string(),
                    rsvps.iter()
                    .filter(|r| {
                        let status: ServingStatusType = r.try_get("rsvp_status").unwrap_or(ServingStatusType::Pending);
                        status == ServingStatusType::Declined
                    })
                    .count()),
            ]);

            let converted_rsvps: Vec<RSVPWithEventResponse> = rsvps
                .iter()
                .map(|r| RSVPWithEventResponse {
                    id: r.try_get("id").unwrap(),
                    email: r.try_get("email").unwrap(),
                    event_id: r.try_get("event_id").unwrap(),
                    user_id: r.try_get("user_id").unwrap(),
                    rsvp_status: r.try_get("rsvp_status").unwrap(),
                    rsvp_date: r.try_get("rsvp_date").unwrap(),
                    event_title: r.try_get("event_title").unwrap(),
                    event_date: r.try_get("event_date").unwrap(),
                    event_time: r.try_get("event_time").unwrap(),
                })
                .collect();

            let response = serde_json::json!({
                "rsvps": converted_rsvps,
                "total": total_count,
                "status_counts": status_counts,
            });

            HttpResponse::Ok().json(response)
        }
        Err(err) => {
            eprintln!("Search error: {}", err);
            HttpResponse::InternalServerError().json("Failed to search RSVPs")
        }
    }
}
