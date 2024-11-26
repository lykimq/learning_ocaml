use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use chrono::NaiveDate;
use serde_json;

// Define RSVP status enum
#[derive(Debug, Deserialize, Serialize, Clone, sqlx::Type)]
#[sqlx(type_name = "rsvp_status", rename_all = "lowercase")]
pub enum RsvpStatus {
    Pending,
    Confirmed,
    Declined
}

#[derive(Deserialize)]
pub struct EventRSVPRequest {
    email: String,
    event_id: i32,
    user_id: Option<i32>,
    rsvp_status: RsvpStatus,
}

#[derive(Serialize)]
pub struct RSVPResponse {
    id: i32,
    email: String,
    event_id: i32,
    user_id: Option<i32>,
    rsvp_status: RsvpStatus,
    rsvp_date: NaiveDate,
}

// Add these response structs
#[derive(Serialize)]
pub struct RSVPListResponse {
    id: i32,
    email: String,
    event_id: i32,
    user_id: Option<i32>,
    rsvp_status: RsvpStatus,
    rsvp_date: NaiveDate,
}

#[derive(Serialize)]
pub struct RSVPWithEventResponse {
    id: i32,
    email: String,
    event_id: i32,
    user_id: Option<i32>,
    rsvp_status: RsvpStatus,
    rsvp_date: NaiveDate,
    event_title: String,
    event_date: NaiveDate,
    event_time: String,
}

// Add this response struct for search results
#[derive(Serialize)]
pub struct RSVPSearchResponse {
    id: i32,
    email: String,
    event_id: i32,
    user_id: Option<i32>,
    rsvp_status: RsvpStatus,
    rsvp_date: NaiveDate,
    event_title: String,
    event_date: NaiveDate,
    event_time: String,
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
                RsvpStatus::Declined => RsvpStatus::Declined,
                _ => RsvpStatus::Pending
            };

            let result = sqlx::query!(
                r#"
                INSERT INTO eventrsvp (email, event_id, user_id, rsvp_date, rsvp_status)
                VALUES ($1, $2, $3, CURRENT_DATE, $4)
                RETURNING id, email, event_id, user_id, rsvp_status as "rsvp_status!: RsvpStatus", rsvp_date
                "#,
                rsvp_data.email,
                rsvp_data.event_id,
                rsvp_data.user_id,
                initial_status as RsvpStatus,
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
    pool: web::Data<PgPool>
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        SELECT er.id, er.email, er.event_id, er.user_id,
               er.rsvp_status as "rsvp_status!: RsvpStatus", er.rsvp_date,
               e.event_title, e.event_date, e.event_time
        FROM eventrsvp er
        JOIN events e ON er.event_id = e.id
        ORDER BY e.event_date DESC, e.event_time DESC
        "#
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(rsvps) => {
            let response: Vec<RSVPWithEventResponse> = rsvps
                .into_iter()
                .map(|r| RSVPWithEventResponse {
                    id: r.id,
                    email: r.email,
                    event_id: r.event_id,
                    user_id: r.user_id,
                    rsvp_status: r.rsvp_status,
                    rsvp_date: r.rsvp_date,
                    event_title: r.event_title,
                    event_date: r.event_date,
                    event_time: r.event_time.to_string(),
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
               er.rsvp_status as "rsvp_status!: RsvpStatus", er.rsvp_date,
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
                "rsvps": rsvps.into_iter().map(|r| RSVPWithEventResponse {
                    id: r.id,
                    email: r.email,
                    event_id: r.event_id,
                    user_id: r.user_id,
                    rsvp_status: r.rsvp_status,
                    rsvp_date: r.rsvp_date,
                    event_title: r.event_title,
                    event_date: r.event_date,
                    event_time: r.event_time.to_string(),
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
               er.rsvp_status as "rsvp_status!: RsvpStatus", er.rsvp_date,
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
                .into_iter()
                .map(|r| RSVPWithEventResponse {
                    id: r.id,
                    email: r.email,
                    event_id: r.event_id,
                    user_id: r.user_id,
                    rsvp_status: r.rsvp_status,
                    rsvp_date: r.rsvp_date,
                    event_title: r.event_title,
                    event_date: r.event_date,
                    event_time: r.event_time.to_string(),
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
    status: web::Json<RsvpStatus>) -> impl Responder {
        let result = sqlx::query!(
            r#"
            UPDATE eventrsvp
            SET rsvp_status = $1
            WHERE id = $2
            RETURNING id, email, event_id, user_id, rsvp_status as "rsvp_status!: RsvpStatus", rsvp_date
            "#,
            status.into_inner() as RsvpStatus,
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

#[derive(Deserialize)]
pub struct SearchQuery {
    query: String,
}

pub async fn search_rsvps(
    pool: web::Data<PgPool>,
    query: web::Query<SearchQuery>,
) -> impl Responder {
    let search_term = format!("%{}%", query.query);

    let rsvps = sqlx::query!(
        r#"
        SELECT
            r.id,
            r.email,
            r.event_id,
            r.user_id,
            r.rsvp_status as "rsvp_status!: RsvpStatus",
            r.rsvp_date,
            e.event_title,
            e.event_date,
            e.event_time::text
        FROM eventrsvp r
        JOIN events e ON r.event_id = e.id
        WHERE
            LOWER(r.email) LIKE LOWER($1)
            OR LOWER(e.event_title) LIKE LOWER($1)
        ORDER BY e.event_date DESC, e.event_time DESC
        "#,
        search_term
    )
    .fetch_all(pool.get_ref())
    .await;

    match rsvps {
        Ok(results) => {
            let response: Vec<RSVPSearchResponse> = results
                .into_iter()
                .map(|r| RSVPSearchResponse {
                    id: r.id,
                    email: r.email,
                    event_id: r.event_id,
                    user_id: r.user_id,
                    rsvp_status: r.rsvp_status,
                    rsvp_date: r.rsvp_date,
                    event_title: r.event_title,
                    event_date: r.event_date,
                    event_time: r.event_time.unwrap_or_default(),
                })
                .collect();
            HttpResponse::Ok().json(response)
        }
        Err(_) => HttpResponse::InternalServerError().json("Failed to search RSVPs")
    }
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
        RETURNING id, email, event_id, user_id, rsvp_status as "rsvp_status!: RsvpStatus", rsvp_date
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
    rsvp_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE eventrsvp
        SET rsvp_status = 'declined'
        WHERE id = $1 AND rsvp_status = 'pending'
        RETURNING id, email, event_id, user_id, rsvp_status as "rsvp_status!: RsvpStatus", rsvp_date
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
            eprintln!("Failed to decline RSVP: {}", e);
            HttpResponse::InternalServerError().json("Failed to decline RSVP")
        }
    }
}