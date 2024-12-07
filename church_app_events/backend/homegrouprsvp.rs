use std::collections::HashMap;
use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, postgres::PgRow, Row};
use chrono::NaiveDateTime;
use serde_json;

// Define Registration status enum
#[derive(Debug, Deserialize, Serialize, Clone, sqlx::Type, PartialEq)]
#[sqlx(type_name = "registration_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum RegistrationStatus {
    Pending,
    Approved,
    Declined
}

impl std::fmt::Display for RegistrationStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RegistrationStatus::Pending => write!(f, "pending"),
            RegistrationStatus::Approved => write!(f, "approved"),
            RegistrationStatus::Declined => write!(f, "declined"),
        }
    }
}

impl std::str::FromStr for RegistrationStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" => Ok(RegistrationStatus::Pending),
            "approved" => Ok(RegistrationStatus::Approved),
            "declined" => Ok(RegistrationStatus::Declined),
            _ => Err(format!("Invalid status: {}", s)),
        }
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct HomeGroupRegistrationRequest {
    pub email: String,
    pub name: String,
    pub home_group_id: i32,
    pub user_id: Option<i32>,
    pub registration_status: RegistrationStatus,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct RegistrationResponse {
    id: i32,
    email: String,
    name: String,
    home_group_id: i32,
    user_id: Option<i32>,
    registration_status: RegistrationStatus,
    registration_date: NaiveDateTime,
}

#[derive(Serialize)]
pub struct RegistrationWithGroupResponse {
    id: i32,
    email: String,
    home_group_id: i32,
    user_id: Option<i32>,
    registration_status: RegistrationStatus,
    registration_date: NaiveDateTime,
    group_name: String,
    group_location: Option<String>,
}

impl<'r> sqlx::FromRow<'r, PgRow> for RegistrationWithGroupResponse {
    fn from_row(row: &'r PgRow) -> Result<Self, sqlx::Error> {
        Ok(RegistrationWithGroupResponse {
            id: row.try_get("id")?,
            email: row.try_get("email")?,
            home_group_id: row.try_get("home_group_id")?,
            user_id: row.try_get("user_id")?,
            registration_status: row.try_get("registration_status")?,
            registration_date: row.try_get("registration_date")?,
            group_name: row.try_get("group_name")?,
            group_location: row.try_get("group_location")?,
        })
    }
}

// Create a new registration
pub async fn create_registration(
    pool: web::Data<PgPool>,
    registration_data: web::Json<HomeGroupRegistrationRequest>,
) -> impl Responder {
    // Check if the user is already registered for this home group
    let existing = sqlx::query!(
        "SELECT user_id FROM homegroupregistrations WHERE email = $1 AND home_group_id = $2",
        registration_data.email,
        registration_data.home_group_id
    )
    .fetch_optional(pool.get_ref())
    .await;

    match existing {
        Ok(Some(_)) => {
            HttpResponse::BadRequest().json("This email has already registered for this home group")
        }
        Ok(None) => {
            // Determine initial status based on the request
            let initial_status =
            match registration_data.registration_status {
                RegistrationStatus::Declined => RegistrationStatus::Declined,
                _ => RegistrationStatus::Pending,
            };

            let result = sqlx::query!(
                r#"
                INSERT INTO homegroupregistrations
                (email, name, home_group_id, user_id,
                registration_date, registration_status)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
                RETURNING id, email, name, home_group_id, user_id,
                registration_status as "registration_status!: RegistrationStatus",
                registration_date
                "#,
                registration_data.email,
                registration_data.name,
                registration_data.home_group_id,
                registration_data.user_id,
                initial_status as RegistrationStatus,
            )
            .fetch_one(pool.get_ref())
            .await;

            match result {
                Ok(registration) => HttpResponse::Ok().json(RegistrationResponse {
                    id: registration.id,
                    email: registration.email,
                    name: registration.name,
                    home_group_id: registration.home_group_id,
                    user_id: registration.user_id,
                    registration_status: registration.registration_status,
                    registration_date: registration.registration_date.expect("Registration date should be present"),
                }),
                Err(e) => {
                    eprintln!("Failed to create registration: {}", e);
                    HttpResponse::InternalServerError().json(format!("Failed to create registration: {}", e))
                }
            }
        }
        Err(e) => {
            eprintln!("Database error: {}", e);
            HttpResponse::InternalServerError().json(format!("Database error: {}", e))
        }
    }
}

// Get all registrations with group details
pub async fn get_all_registrations(
    pool: web::Data<PgPool>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        SELECT hr.id, hr.email, hr.home_group_id, hr.user_id,
               hr.registration_status as "registration_status!: RegistrationStatus",
               hr.registration_date,
               hg.name as group_name, hg.location as group_location
        FROM homegroupregistrations hr
        JOIN homegroups hg ON hr.home_group_id = hg.id
        ORDER BY hr.registration_date DESC
        "#
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(registrations) => {
            let response: Vec<RegistrationWithGroupResponse> = registrations
                .iter()
                .map(|r| RegistrationWithGroupResponse {
                    id: r.id,
                    email: r.email.clone(),
                    home_group_id: r.home_group_id,
                    user_id: r.user_id,
                    registration_status: r.registration_status.clone(),
                    registration_date: r.registration_date.expect("Registration date should be present"),
                    group_name: r.group_name.clone(),
                    group_location: r.group_location.clone(),
                })
                .collect();
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            eprintln!("Failed to fetch registrations: {}", e);
            HttpResponse::InternalServerError().json("Failed to fetch registrations")
        }
    }
}

// Get registrations for a specific home group with counts
pub async fn get_registrations_by_group(
    pool: web::Data<PgPool>,
    home_group_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        WITH status_counts AS (
            SELECT
                COUNT(CASE WHEN registration_status = 'approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN registration_status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN registration_status = 'declined' THEN 1 END) as declined_count
            FROM homegroupregistrations
            WHERE home_group_id = $1
        )
        SELECT hr.id, hr.email, hr.home_group_id, hr.user_id,
               hr.registration_status as "registration_status!: RegistrationStatus",
               hr.registration_date,
               hg.name as group_name, hg.location as group_location,
               sc.approved_count, sc.pending_count, sc.declined_count
        FROM homegroupregistrations hr
        JOIN homegroups hg ON hr.home_group_id = hg.id
        CROSS JOIN status_counts sc
        WHERE hr.home_group_id = $1
        ORDER BY hr.registration_date DESC
        "#,
        home_group_id.into_inner()
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(registrations) => {
            if registrations.is_empty() {
                return HttpResponse::NotFound().json("No registrations found for this home group");
            }

            // Create a response that includes both the registration list and the counts
            let response = serde_json::json!({
                "counts": {
                    "approved": registrations[0].approved_count,
                    "pending": registrations[0].pending_count,
                    "declined": registrations[0].declined_count,
                },
                "registrations": registrations.iter().map(|r| RegistrationWithGroupResponse {
                    id: r.id,
                    email: r.email.clone(),
                    home_group_id: r.home_group_id,
                    user_id: r.user_id,
                    registration_status: r.registration_status.clone(),
                    registration_date: r.registration_date.expect("Registration date should be present"),
                    group_name: r.group_name.clone(),
                    group_location: r.group_location.clone(),
                }).collect::<Vec<_>>()
            });

            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            eprintln!("Failed to fetch registrations for home group: {}", e);
            HttpResponse::InternalServerError().json("Failed to fetch registrations")
        }
    }
}

// Get all registrations by email
pub async fn get_registrations_by_email(
    pool: web::Data<PgPool>,
    email: web::Path<String>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        SELECT hr.id, hr.email, hr.home_group_id, hr.user_id,
               hr.registration_status as "registration_status!: RegistrationStatus",
               hr.registration_date,
               hg.name as group_name, hg.location as group_location
        FROM homegroupregistrations hr
        JOIN homegroups hg ON hr.home_group_id = hg.id
        WHERE hr.email = $1
        ORDER BY hr.registration_date DESC
        "#,
        email.into_inner()
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(registrations) => {
            let response: Vec<RegistrationWithGroupResponse> = registrations
                .iter()
                .map(|r| RegistrationWithGroupResponse {
                    id: r.id,
                    email: r.email.clone(),
                    home_group_id: r.home_group_id,
                    user_id: r.user_id,
                    registration_status: r.registration_status.clone(),
                    registration_date: r.registration_date.expect("Registration date should be present"),
                    group_name: r.group_name.clone(),
                    group_location: r.group_location.clone(),
                })
                .collect();
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            eprintln!("Failed to fetch registrations: {}", e);
            HttpResponse::InternalServerError().json("Failed to fetch registrations")
        }
    }
}

// Update a registration
pub async fn update_registration(
    pool: web::Data<PgPool>,
    registration_id: web::Path<i32>,
    status: web::Json<RegistrationStatus>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE homegroupregistrations
        SET registration_status = $1
        WHERE id = $2
        RETURNING id, email, name, home_group_id, user_id,
        registration_status as "registration_status!: RegistrationStatus",
        registration_date
        "#,
        status.into_inner() as RegistrationStatus,
        registration_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(registration) => HttpResponse::Ok().json(RegistrationResponse {
            id: registration.id,
            email: registration.email,
            name: registration.name,
            home_group_id: registration.home_group_id,
            user_id: registration.user_id,
            registration_status: registration.registration_status,
            registration_date: registration.registration_date.expect("Registration date should be present"),
        }),
        Err(e) => {
            eprintln!("Failed to update registration status: {}", e);
            HttpResponse::InternalServerError().json("Failed to update registration status")
        }
    }
}

// Delete a registration
pub async fn delete_registration(
    pool: web::Data<PgPool>,
    registration_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        "DELETE FROM homegroupregistrations WHERE id = $1 RETURNING id",
        registration_id.into_inner()
    )
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(_)) => HttpResponse::Ok().json("Registration deleted successfully"),
        Ok(None) => HttpResponse::NotFound().json("Registration not found"),
        Err(e) => {
            eprintln!("Failed to delete registration: {}", e);
            HttpResponse::InternalServerError().json("Failed to delete registration")
        }
    }
}

// Confirm a registration
pub async fn confirm_registration(
    pool: web::Data<PgPool>,
    registration_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE homegroupregistrations
        SET registration_status = 'approved'
        WHERE id = $1 AND registration_status = 'pending'
        RETURNING id, email, name, home_group_id, user_id,
        registration_status as "registration_status!: RegistrationStatus",
        registration_date
        "#,
        registration_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(registration) => HttpResponse::Ok().json(RegistrationResponse {
            id: registration.id,
            email: registration.email,
            name: registration.name,
            home_group_id: registration.home_group_id,
            user_id: registration.user_id,
            registration_status: registration.registration_status,
            registration_date: registration.registration_date.expect("Registration date should be present"),
        }),
        Err(e) => {
            eprintln!("Failed to confirm registration: {}", e);
            HttpResponse::InternalServerError().json("Failed to confirm registration")
        }
    }
}

// Decline a registration
pub async fn decline_registration(
    pool: web::Data<PgPool>,
    registration_id: web::Path<i32>,
) -> impl Responder {
    let result = sqlx::query!(
        r#"
        UPDATE homegroupregistrations
        SET registration_status = 'declined'
        WHERE id = $1 AND registration_status = 'pending'
        RETURNING id, email, name, home_group_id, user_id,
        registration_status as "registration_status!: RegistrationStatus",
        registration_date
        "#,
        registration_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(registration) => HttpResponse::Ok().json(RegistrationResponse {
            id: registration.id,
            email: registration.email,
            name: registration.name,
            home_group_id: registration.home_group_id,
            user_id: registration.user_id,
            registration_status: registration.registration_status,
            registration_date: registration.registration_date.expect("Registration date should be present"),
        }),
        Err(e) => {
            eprintln!("Failed to decline registration: {}", e);
            HttpResponse::InternalServerError().json("Failed to decline registration")
        }
    }
}

#[derive(Deserialize, Debug)]
pub struct SearchQuery {
    pub email: Option<String>,
    pub group_name: Option<String>,
    pub status: Option<RegistrationStatus>,
    pub user_id: Option<i32>,
}

// Search registrations
pub async fn search_registrations(
    pool: web::Data<PgPool>,
    params: web::Query<SearchQuery>,
) -> impl Responder {
    let mut count_query = sqlx::QueryBuilder::new(
        "SELECT COUNT (*) as count
         FROM homegroupregistrations hr
         JOIN homegroups hg ON hr.home_group_id = hg.id
         WHERE 1=1"
    );

    // Apply status filter if provided
    if let Some(status) = &params.status {
        count_query.push(" AND hr.registration_status = ");
        count_query.push_bind(status);
    }

    // Email filter with improved pattern matching
    if let Some(email) = &params.email {
        let search_pattern = format!("%{}%", email.trim().to_lowercase());
        count_query.push(" AND LOWER(hr.email) LIKE ");
        count_query.push_bind(search_pattern);
    }

    // Group name filter with improved pattern matching
    if let Some(group_name) = &params.group_name {
        let search_pattern = format!("%{}%", group_name.trim().to_lowercase());
        count_query.push(" AND LOWER(hg.name) LIKE ");
        count_query.push_bind(search_pattern);
    }

    // User ID filter
    if let Some(user_id) = params.user_id {
        count_query.push(" AND hr.user_id = ");
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
                return HttpResponse::InternalServerError().json("Failed to count registrations");
            }
        };

    // Default sorting by registration date
    let mut search_query = sqlx::QueryBuilder::new(
        "SELECT hr.id, hr.email, hr.home_group_id, hr.user_id,
                hr.registration_status as \"registration_status\",
                hr.registration_date, hg.name as group_name, hg.location as group_location
         FROM homegroupregistrations hr
         JOIN homegroups hg ON hr.home_group_id = hg.id
         WHERE 1=1"
    );

    // Apply status filter if provided
    if let Some(status) = &params.status {
        search_query.push(" AND hr.registration_status = ");
        search_query.push_bind(status);
    }

    // Apply email filter if provided
    if let Some(email) = &params.email {
        let search_pattern = format!("%{}%", email.trim().to_lowercase());
        search_query.push(" AND LOWER(hr.email) LIKE ");
        search_query.push_bind(search_pattern);
    }

    // Apply group name filter if provided
    if let Some(group_name) = &params.group_name {
        let search_pattern = format!("%{}%", group_name.trim().to_lowercase());
        search_query.push(" AND LOWER(hg.name) LIKE ");
        search_query.push_bind(search_pattern);
    }

    // Apply user ID filter if provided
    if let Some(user_id) = params.user_id {
        search_query.push(" AND hr.user_id = ");
        search_query.push_bind(user_id);
    }

    // Execute the query
    search_query.push(" ORDER BY hr.registration_date DESC");

    match search_query
        .build()
        .fetch_all(pool.get_ref())
        .await {
        Ok(registrations) => {
            // Calculate status counts
            let status_counts = HashMap::from([
                ("approved".to_string(),
                    registrations.iter()
                    .filter(|r| {
                        let status: RegistrationStatus = r.try_get("registration_status").unwrap_or(RegistrationStatus::Pending);
                        status == RegistrationStatus::Approved
                    })
                    .count()),
                ("pending".to_string(),
                    registrations.iter()
                    .filter(|r| {
                        let status: RegistrationStatus = r.try_get("registration_status").unwrap_or(RegistrationStatus::Pending);
                        status == RegistrationStatus::Pending
                    })
                    .count()),
                ("declined".to_string(),
                    registrations.iter()
                    .filter(|r| {
                        let status: RegistrationStatus = r.try_get("registration_status").unwrap_or(RegistrationStatus::Pending);
                        status == RegistrationStatus::Declined
                    })
                    .count()),
            ]);

            let converted_registrations: Vec<RegistrationWithGroupResponse> = registrations
                .iter()
                .map(|r| RegistrationWithGroupResponse {
                    id: r.try_get("id").unwrap(),
                    email: r.try_get("email").unwrap(),
                    home_group_id: r.try_get("home_group_id").unwrap(),
                    user_id: r.try_get("user_id").unwrap(),
                    registration_status: r.try_get("registration_status").unwrap(),
                    registration_date: r.try_get("registration_date").unwrap(),
                    group_name: r.try_get("group_name").unwrap(),
                    group_location: r.try_get("group_location").unwrap(),
                })
                .collect();

            let response = serde_json::json!({
                "registrations": converted_registrations,
                "total": total_count as usize,
                "status_counts": status_counts,
            });

            HttpResponse::Ok().json(response)
        }
        Err(err) => {
            eprintln!("Search error: {}", err);
            HttpResponse::InternalServerError().json("Failed to search registrations")
        }
    }
}

